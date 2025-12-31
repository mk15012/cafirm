import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId } from '../utils/caOrganization';

// Helper function to format price from paise to rupees
function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// Helper function to get plan from database with caching
async function getPlanFromDB(planCode: string) {
  const plan = await prisma.plan.findUnique({
    where: { code: planCode },
  });
  return plan;
}

// Helper function to get default/free plan
async function getDefaultPlan() {
  let plan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!plan) {
    // Fallback defaults if no plan in DB
    return {
      code: 'FREE',
      name: 'Starter',
      description: 'Free tier',
      monthlyPricePaise: 0,
      yearlyPricePaise: 0,
      maxClients: 3,
      maxFirmsPerClient: 2,
      maxUsers: 1,
      maxStorageMB: 100,
      maxCredentials: 5,
      features: '{}',
      isActive: true,
      isPopular: false,
    };
  }
  return plan;
}

// Get all available plans (public)
export async function getPlans(req: Request, res: Response) {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const plans = dbPlans.map((plan: any) => {
      const features = plan.features ? JSON.parse(plan.features) : {};
      return {
        id: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPrice: formatPrice(plan.monthlyPricePaise),
        yearlyPrice: formatPrice(plan.yearlyPricePaise),
        monthlyPricePaise: plan.monthlyPricePaise,
        yearlyPricePaise: plan.yearlyPricePaise,
        popular: plan.isPopular,
        limits: {
          clients: plan.maxClients === -1 ? 'Unlimited' : plan.maxClients,
          firmsPerClient: plan.maxFirmsPerClient === -1 ? 'Unlimited' : plan.maxFirmsPerClient,
          users: plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers,
          storage: plan.maxStorageMB >= 1024
            ? `${plan.maxStorageMB / 1024} GB`
            : `${plan.maxStorageMB} MB`,
          credentials: plan.maxCredentials === -1 ? 'Unlimited' : plan.maxCredentials,
        },
        features,
      };
    });

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

// Get current user's subscription
export async function getMySubscription(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the CA's user ID for this organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get or create subscription for the CA
    let subscription = await prisma.subscription.findUnique({
      where: { userId: caId },
    });

    // Auto-create FREE subscription if none exists
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: caId,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
    }

    // Get plan details from database
    const plan = await getPlanFromDB(subscription.plan) || await getDefaultPlan();
    const features = plan.features ? JSON.parse(plan.features) : {};

    // Get current usage
    const usage = await calculateUsage(caId);

    res.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: plan.name,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
      },
      usage: {
        clients: { used: usage.clients, limit: plan.maxClients },
        firms: { used: usage.firms, limit: plan.maxFirmsPerClient * usage.clients || plan.maxFirmsPerClient },
        users: { used: usage.users, limit: plan.maxUsers },
        storageMB: { used: usage.storageMB, limit: plan.maxStorageMB },
        credentials: { used: usage.credentials, limit: plan.maxCredentials },
      },
      features,
      limits: {
        maxClients: plan.maxClients,
        maxFirmsPerClient: plan.maxFirmsPerClient,
        maxUsers: plan.maxUsers,
        maxStorageMB: plan.maxStorageMB,
        maxCredentials: plan.maxCredentials,
        features,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

// Check if user can perform an action based on plan limits
export async function checkLimit(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resource } = req.params; // clients, firms, users, credentials

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: caId },
    });

    const planCode = subscription?.plan || 'FREE';
    const plan = await getPlanFromDB(planCode) || await getDefaultPlan();
    const usage = await calculateUsage(caId);

    let canProceed = false;
    let currentUsage = 0;
    let limit = 0;
    let message = '';

    switch (resource) {
      case 'clients':
        limit = plan.maxClients;
        currentUsage = usage.clients;
        canProceed = limit === -1 || currentUsage < limit;
        message = canProceed ? 'OK' : `You've reached the maximum of ${limit} clients on your ${plan.name} plan.`;
        break;
      case 'users':
        limit = plan.maxUsers;
        currentUsage = usage.users;
        canProceed = limit === -1 || currentUsage < limit;
        message = canProceed ? 'OK' : `You've reached the maximum of ${limit} team members on your ${plan.name} plan.`;
        break;
      case 'credentials':
        limit = plan.maxCredentials;
        currentUsage = usage.credentials;
        canProceed = limit === -1 || currentUsage < limit;
        message = canProceed ? 'OK' : `You've reached the maximum of ${limit} stored credentials on your ${plan.name} plan.`;
        break;
      default:
        canProceed = true;
        message = 'OK';
    }

    res.json({
      canProceed,
      currentUsage,
      limit: limit === -1 ? 'Unlimited' : limit,
      message,
      upgradeRequired: !canProceed,
      currentPlan: planCode,
    });
  } catch (error) {
    console.error('Check limit error:', error);
    res.status(500).json({ error: 'Failed to check limits' });
  }
}

// Upgrade subscription (simulated - in production, integrate with Razorpay)
export async function upgradePlan(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only CA can upgrade
    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only the CA can manage subscriptions' });
    }

    const { plan: planCode, billingCycle } = req.body;

    // Validate plan exists in database
    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Get price from database (secure - not from client)
    const price = billingCycle === 'yearly' ? plan.yearlyPricePaise : plan.monthlyPricePaise;

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Upsert subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.userId },
      update: {
        plan: planCode as any,
        status: 'ACTIVE',
        billingCycle,
        priceInPaise: price,
        startDate,
        endDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: price,
      },
      create: {
        userId: user.userId,
        plan: planCode as any,
        status: 'ACTIVE',
        billingCycle,
        priceInPaise: price,
        startDate,
        endDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: price,
      },
    });

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan!`,
      subscription: {
        plan: subscription.plan,
        planName: plan.name,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: formatPrice(price),
      },
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
}

// Helper function to calculate current usage
async function calculateUsage(caId: number) {
  // Get all users in the CA's organization
  const allUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: caId },
        { reportsToId: caId },
        { reportsTo: { reportsToId: caId } },
      ],
    },
    select: { id: true },
  });
  const userIds = allUsers.map((u) => u.id);

  // Count clients
  const clients = await prisma.client.count({
    where: { createdById: { in: userIds } },
  });

  // Count firms
  const firms = await prisma.firm.count({
    where: { createdById: { in: userIds } },
  });

  // Count users (team members)
  const users = allUsers.length;

  // Calculate storage (approximate based on documents)
  const documents = await prisma.document.aggregate({
    where: { uploadedById: { in: userIds } },
    _sum: { fileSize: true },
  });
  const storageMB = Math.round((documents._sum.fileSize || 0) / (1024 * 1024));

  // Count credentials
  const credentials = await prisma.clientCredential.count({
    where: { createdById: { in: userIds } },
  });

  return { clients, firms, users, storageMB, credentials };
}
