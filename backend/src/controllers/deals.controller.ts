import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { createDealSchema, updateDealSchema, updateDealStageSchema } from '../schemas';
import { Prisma, DealStage } from '@prisma/client';

const DEAL_INCLUDE = {
  client: { select: { id: true, fullName: true, phone: true, email: true } },
  property: { select: { id: true, title: true, address: true, price: true, currency: true, photos: { take: 1 } } },
  agent: { select: { id: true, name: true, email: true } },
};

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, assignedTo, clientId, groupBy, page = '1', limit = '50' } = req.query;

    const where: Prisma.DealWhereInput = {};

    if (req.user!.role === 'AGENT') {
      where.assignedTo = req.user!.userId;
    }

    if (stage) where.stage = stage as DealStage;
    if (assignedTo) where.assignedTo = assignedTo as string;
    if (clientId) where.clientId = clientId as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    if (groupBy === 'stage') {
      const stages: DealStage[] = ['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED'];
      const result: Record<string, any[]> = {};

      await Promise.all(
        stages.map(async (s) => {
          result[s] = await prisma.deal.findMany({
            where: { ...where, stage: s },
            include: DEAL_INCLUDE,
            orderBy: { createdAt: 'asc' },
          });
        })
      );

      res.json(result);
      return;
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: DEAL_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.deal.count({ where }),
    ]);

    res.json({ data: deals, total, page: parseInt(page as string), limit: take });
  } catch (err) {
    next(err);
  }
};

export const getDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        ...DEAL_INCLUDE,
        tasks: { orderBy: { dueAt: 'asc' } },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!deal) throw new AppError('Deal not found', 404);

    if (req.user!.role === 'AGENT' && deal.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    res.json(deal);
  } catch (err) {
    next(err);
  }
};

export const createDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createDealSchema.parse(req.body);

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw new AppError('Client not found', 404);

    const deal = await prisma.deal.create({
      data: {
        ...data,
        assignedTo: data.assignedTo || req.user!.userId,
        nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null,
      },
      include: DEAL_INCLUDE,
    });

    await prisma.activity.create({
      data: {
        type: 'DEAL_CREATED',
        content: `Deal created at stage: ${deal.stage}`,
        userId: req.user!.userId,
        clientId: deal.clientId,
        dealId: deal.id,
      },
    });

    // Update client status to ACTIVE if NEW
    if (client.status === 'NEW') {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { status: 'ACTIVE' },
      });
    }

    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
};

export const updateDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateDealSchema.parse(req.body);

    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Deal not found', 404);

    if (req.user!.role === 'AGENT' && existing.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...data,
        nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
      },
      include: DEAL_INCLUDE,
    });

    res.json(deal);
  } catch (err) {
    next(err);
  }
};

export const updateDealStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, lostReason } = updateDealStageSchema.parse(req.body);

    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Deal not found', 404);

    if (req.user!.role === 'AGENT' && existing.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage, lostReason: lostReason || null },
      include: DEAL_INCLUDE,
    });

    await prisma.activity.create({
      data: {
        type: 'STAGE_CHANGE',
        content: `Deal stage changed: ${existing.stage} → ${stage}${lostReason ? `. Reason: ${lostReason}` : ''}`,
        userId: req.user!.userId,
        clientId: deal.clientId,
        dealId: deal.id,
      },
    });

    // Auto-update client status when deal is closed
    if (stage === 'CLOSED') {
      await prisma.client.update({
        where: { id: deal.clientId },
        data: { status: 'CONVERTED' },
      });
    }

    res.json(deal);
  } catch (err) {
    next(err);
  }
};

export const deleteDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      throw new AppError('Only admins can delete deals', 403);
    }

    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Deal not found', 404);

    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
