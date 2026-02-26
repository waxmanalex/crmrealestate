import { Router } from 'express';
import { login, refresh, me, register, getUsers } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/register', authenticate, requireAdmin, register);
router.get('/me', authenticate, me);
router.get('/users', authenticate, getUsers);

export default router;
