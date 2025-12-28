import { Router } from 'express';
import { getMetrics, getRecentTasks, getUpcomingDeadlines } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/metrics', getMetrics);
router.get('/recent-tasks', getRecentTasks);
router.get('/upcoming-deadlines', getUpcomingDeadlines);

export default router;

