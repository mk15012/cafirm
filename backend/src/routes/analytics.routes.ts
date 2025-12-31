import { Router } from 'express';
import {
  getRevenueAnalytics,
  getTaskAnalytics,
  getClientAnalytics,
  getOverviewAnalytics,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/revenue', getRevenueAnalytics);
router.get('/tasks', getTaskAnalytics);
router.get('/clients', getClientAnalytics);
router.get('/overview', getOverviewAnalytics);

export default router;

