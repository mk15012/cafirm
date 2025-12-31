import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlans,
  getMySubscription,
  checkLimit,
  upgradePlan,
} from '../controllers/subscription.controller';

const router = Router();

// Public route - anyone can view plans
router.get('/plans', getPlans);

// Protected routes
router.get('/my', authenticate, getMySubscription);
router.get('/check/:resource', authenticate, checkLimit);
router.post('/upgrade', authenticate, upgradePlan);

export default router;

