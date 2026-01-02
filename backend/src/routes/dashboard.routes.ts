import { Router } from 'express';
import { getMetrics, getRecentTasks, getUpcomingDeadlines, getTodaysBirthdays } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/metrics', getMetrics);
router.get('/recent-tasks', getRecentTasks);
router.get('/upcoming-deadlines', getUpcomingDeadlines);
router.get('/birthdays-today', getTodaysBirthdays);

export default router;

