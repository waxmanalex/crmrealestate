import { Router } from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from '../controllers/deals.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getDeals);
router.post('/', createDeal);
router.get('/:id', getDeal);
router.put('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);
router.delete('/:id', deleteDeal);

export default router;
