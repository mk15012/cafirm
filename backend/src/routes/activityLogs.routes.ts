import { Router } from 'express';
import { getActivityLogs, getActivityLog } from '../controllers/activityLogs.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('CA')); // Only CA can view activity logs

router.get('/', getActivityLogs);
router.get('/:id', getActivityLog);

export default router;

