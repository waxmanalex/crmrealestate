import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { createTaskSchema, updateTaskSchema } from '../schemas';
import { Prisma } from '@prisma/client';

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, assignedTo, due, relatedClientId, relatedDealId, page = '1', limit = '50' } = req.query;

    const where: Prisma.TaskWhereInput = {};

    if (req.user!.role === 'AGENT') {
      where.assignedTo = req.user!.userId;
    }

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (assignedTo) where.assignedTo = assignedTo as string;
    if (relatedClientId) where.relatedClientId = relatedClientId as string;
    if (relatedDealId) where.relatedDealId = relatedDealId as string;

    if (due === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.dueAt = { gte: today, lt: tomorrow };
    } else if (due === 'overdue') {
      where.dueAt = { lt: new Date() };
      where.status = { not: 'DONE' };
    } else if (due === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoDaysAhead = new Date(today);
      twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);
      where.dueAt = { gte: today, lte: twoDaysAhead };
      where.status = { not: 'DONE' };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          client: { select: { id: true, fullName: true } },
          deal: { select: { id: true, stage: true, client: { select: { fullName: true } } } },
          property: { select: { id: true, title: true } },
        },
        orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ data: tasks, total, page: parseInt(page as string), limit: take });
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        agent: { select: { id: true, name: true } },
        client: { select: { id: true, fullName: true, phone: true } },
        deal: { select: { id: true, stage: true } },
        property: { select: { id: true, title: true } },
      },
    });

    if (!task) throw new AppError('Task not found', 404);

    if (req.user!.role === 'AGENT' && task.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        dueAt: new Date(data.dueAt),
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
        assignedTo: data.assignedTo || req.user!.userId,
      },
      include: {
        agent: { select: { id: true, name: true } },
        client: { select: { id: true, fullName: true } },
      },
    });

    if (data.relatedClientId || data.relatedDealId) {
      await prisma.activity.create({
        data: {
          type: 'TASK_CREATED',
          content: `Task created: "${task.title}"`,
          userId: req.user!.userId,
          clientId: data.relatedClientId || null,
          dealId: data.relatedDealId || null,
        },
      });
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Task not found', 404);

    if (req.user!.role === 'AGENT' && existing.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
      },
      include: {
        agent: { select: { id: true, name: true } },
        client: { select: { id: true, fullName: true } },
      },
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Task not found', 404);

    if (req.user!.role === 'AGENT' && existing.assignedTo !== req.user!.userId) {
      throw new AppError('Access denied', 403);
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
