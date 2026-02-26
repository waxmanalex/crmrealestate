import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './clients.routes';
import propertyRoutes from './properties.routes';
import dealRoutes from './deals.routes';
import taskRoutes from './tasks.routes';
import { authenticate } from '../middleware/auth.middleware';
import { getMetrics } from '../controllers/dashboard.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/properties', propertyRoutes);
router.use('/deals', dealRoutes);
router.use('/tasks', taskRoutes);
router.get('/dashboard/metrics', authenticate, getMetrics);

export default router;
