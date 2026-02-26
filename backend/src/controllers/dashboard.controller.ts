import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMetrics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();

    const agentFilter = req.user!.role === 'AGENT' ? { assignedTo: req.user!.userId } : {};

    // New leads in period
    const newLeads = await prisma.client.count({
      where: {
        ...agentFilter,
        createdAt: { gte: since },
      },
    });

    // Deals by stage
    const dealsByStageRaw = await prisma.deal.groupBy({
      by: ['stage'],
      where: agentFilter,
      _count: { stage: true },
    });

    const stages = ['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED'];
    const dealsByStage: Record<string, number> = {};
    stages.forEach((s) => { dealsByStage[s] = 0; });
    dealsByStageRaw.forEach((d) => { dealsByStage[d.stage] = d._count.stage; });

    // Conversion rate (NEW_LEAD → CLOSED)
    const totalLeads = await prisma.deal.count({
      where: { ...agentFilter, createdAt: { gte: since } },
    });
    const closedDeals = await prisma.deal.count({
      where: { ...agentFilter, stage: 'CLOSED', updatedAt: { gte: since } },
    });
    const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0;

    // Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        ...agentFilter,
        dueAt: { lt: now },
        status: { not: 'DONE' },
      },
    });

    // Upcoming tasks (today + tomorrow)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const twoDaysAhead = new Date(todayStart);
    twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);

    const upcomingTasks = await prisma.task.findMany({
      where: {
        ...agentFilter,
        dueAt: { gte: todayStart, lte: twoDaysAhead },
        status: { not: 'DONE' },
      },
      include: {
        client: { select: { id: true, fullName: true } },
        deal: { select: { id: true, stage: true } },
      },
      orderBy: { dueAt: 'asc' },
      take: 10,
    });

    // Lead sources distribution
    const leadSourcesRaw = await prisma.client.groupBy({
      by: ['leadSource'],
      where: { ...agentFilter, createdAt: { gte: since }, leadSource: { not: null } },
      _count: { leadSource: true },
    });

    const leadSources = leadSourcesRaw
      .filter((l) => l.leadSource !== null)
      .map((l) => ({ source: l.leadSource!, count: l._count.leadSource }))
      .sort((a, b) => b.count - a.count);

    // Total pipeline value
    const pipelineValue = await prisma.deal.aggregate({
      where: { ...agentFilter, stage: { not: 'CLOSED' } },
      _sum: { value: true },
    });

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: agentFilter.assignedTo
        ? { userId: agentFilter.assignedTo }
        : {},
      include: {
        user: { select: { id: true, name: true } },
        client: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    res.json({
      period: days,
      newLeads,
      dealsByStage,
      conversionRate,
      overdueTasks,
      upcomingTasks,
      leadSources,
      totalDeals: Object.values(dealsByStage).reduce((a, b) => a + b, 0),
      closedDeals,
      pipelineValue: pipelineValue._sum.value || 0,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};
