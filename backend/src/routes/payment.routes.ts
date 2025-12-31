import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  cancelSubscription,
  handleWebhook,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook doesn't need authentication (called by Razorpay)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(authenticate);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.post('/cancel', cancelSubscription);

export default router;

