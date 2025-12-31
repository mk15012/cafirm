import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId } from '../utils/caOrganization';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Create a Razorpay order for subscription
export async function createOrder(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only CA can purchase subscriptions
    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can manage subscriptions' });
    }

    const { planCode, billingCycle } = req.body;

    if (!planCode || !billingCycle) {
      return res.status(400).json({ error: 'Plan code and billing cycle are required' });
    }

    // Get plan from database
    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly' 
      ? plan.yearlyPricePaise 
      : plan.monthlyPricePaise;

    if (amount === 0) {
      return res.status(400).json({ error: 'Cannot create order for free plan' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_${user.userId}_${Date.now()}`,
      notes: {
        userId: user.userId.toString(),
        planCode,
        billingCycle,
      },
    });

    // Store order in database for verification later
    await prisma.subscription.upsert({
      where: { userId: user.userId },
      update: {
        razorpayOrderId: order.id,
        planCode: plan.code,
        billingCycle,
        priceInPaise: amount,
      },
      create: {
        userId: user.userId,
        planCode: plan.code,
        billingCycle,
        status: 'PENDING',
        razorpayOrderId: order.id,
        priceInPaise: amount,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      billingCycle,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
}

// Verify payment and activate subscription
export async function verifyPayment(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get subscription with pending order
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.userId,
        razorpayOrderId: razorpay_order_id,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription order not found' });
    }

    // Calculate end date based on billing cycle
    const now = new Date();
    const endDate = new Date(now);
    if (subscription.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update subscription to active
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        startDate: now,
        endDate,
        lastPaymentDate: now,
        lastPaymentAmount: subscription.priceInPaise,
        paymentMethod: 'razorpay',
      },
      include: {
        planDetails: true,
      },
    });

    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: {
        planCode: updatedSubscription.planCode,
        planName: updatedSubscription.planDetails?.name,
        status: updatedSubscription.status,
        billingCycle: updatedSubscription.billingCycle,
        startDate: updatedSubscription.startDate,
        endDate: updatedSubscription.endDate,
      },
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
}

// Get payment history
export async function getPaymentHistory(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get subscription with payment info
    const subscription = await prisma.subscription.findUnique({
      where: { userId: caId },
      include: {
        planDetails: true,
      },
    });

    if (!subscription) {
      return res.json({ payments: [] });
    }

    // For now, return the last payment. In a real app, you'd have a separate PaymentHistory table
    const payments = [];
    if (subscription.lastPaymentDate && subscription.lastPaymentAmount) {
      payments.push({
        id: subscription.razorpayPaymentId || 'N/A',
        date: subscription.lastPaymentDate,
        amount: subscription.lastPaymentAmount,
        planName: subscription.planDetails?.name || subscription.planCode,
        billingCycle: subscription.billingCycle,
        status: 'SUCCESS',
      });
    }

    res.json({ payments });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
}

// Cancel subscription
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can manage subscriptions' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Mark as cancelled (will downgrade to free at end of billing period)
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled. You will be downgraded to Free plan at the end of your billing period.',
      endDate: subscription.endDate,
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

// Webhook handler for Razorpay events
export async function handleWebhook(req: Request, res: Response) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    
    switch (event.event) {
      case 'payment.captured':
        // Payment successful - already handled in verifyPayment
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
        
      case 'payment.failed':
        // Payment failed
        const orderId = event.payload.payment.entity.order_id;
        await prisma.subscription.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: 'PAYMENT_FAILED' },
        });
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
        
      case 'subscription.cancelled':
        // Subscription cancelled
        console.log('Subscription cancelled via webhook');
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

