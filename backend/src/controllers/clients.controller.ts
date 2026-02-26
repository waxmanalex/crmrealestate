import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { createClientSchema, updateClientSchema, createActivitySchema } from '../schemas';
import { Prisma } from '@prisma/client';

export const getClients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, leadSource, assignedTo, page = '1', limit = '20' } = req.query;

    const where: Prisma.ClientWhereInput = {};

    if (req.user!.role === 'AGENT') {
      where.assignedTo = req.user!.userId;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status as any;
    if (leadSource) where.leadSource = leadSource as any;
    if (assignedTo) where.assignedTo = assignedTo as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true, email: true } },
          _count: { select: { deals: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients,
      total,
      page: parseInt(page as string),
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

export const getClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        deals: {
          include: { property: true, agent: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueAt: 'asc' },
          where: { status: { not: 'DONE' } },
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        ownedProperties: true,
      },
    });

    if (!client) throw new AppError('Client not found', 404);

    if (req.user!.role === 'AGENT' && client.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createClientSchema.parse(req.body);

    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
        assignedTo: data.assignedTo || req.user!.userId,
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        content: `Client created with status: ${client.status}`,
        userId: req.user!.userId,
        clientId: client.id,
      },
    });

    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateClientSchema.parse(req.body);

    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Client not found', 404);

    if (req.user!.role === 'AGENT' && existing.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { ...data, email: data.email || null },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.status && data.status !== existing.status) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          content: `Status changed from ${existing.status} to ${data.status}`,
          userId: req.user!.userId,
          clientId: client.id,
        },
      });
    }

    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Client not found', 404);

    if (req.user!.role === 'AGENT') {
      throw new AppError('Only admins can delete clients', 403);
    }

    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const addActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createActivitySchema.parse(req.body);

    const activity = await prisma.activity.create({
      data: {
        ...data,
        userId: req.user!.userId,
        clientId: req.params.id,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

export const getClientActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      where: { clientId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
};
