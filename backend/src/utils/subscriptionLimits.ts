import { prisma } from './prisma';

interface PlanLimits {
  maxClients: number;
  maxUsers: number;
  maxCredentials: number;
  maxStorageMB: number;
  name: string;
}

interface UsageStats {
  clients: number;
  users: number;
  credentials: number;
  storageMB: number;
}

interface LimitCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  planName: string;
  message: string;
}

/**
 * Get the plan limits from database or return defaults
 */
async function getPlanLimits(caId: number): Promise<PlanLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: caId },
  });

  const planCode = subscription?.plan || 'FREE';

  const plan = await prisma.plan.findUnique({
    where: { code: planCode },
  });

  if (plan) {
    return {
      maxClients: plan.maxClients,
      maxUsers: plan.maxUsers,
      maxCredentials: plan.maxCredentials,
      maxStorageMB: plan.maxStorageMB,
      name: plan.name,
    };
  }

  // Default FREE plan limits
  return {
    maxClients: 3,
    maxUsers: 1,
    maxCredentials: 10,
    maxStorageMB: 100,
    name: 'Starter',
  };
}

/**
 * Calculate current usage for a CA's organization
 */
async function calculateUsage(caId: number): Promise<UsageStats> {
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

  // Count users (team members)
  const users = allUsers.length;

  // Count credentials
  const credentials = await prisma.clientCredential.count({
    where: { createdById: { in: userIds } },
  });

  // Calculate storage
  const documents = await prisma.document.aggregate({
    where: { uploadedById: { in: userIds } },
    _sum: { fileSize: true },
  });
  const storageMB = Math.round((documents._sum.fileSize || 0) / (1024 * 1024));

  return { clients, users, credentials, storageMB };
}

/**
 * Check if a resource can be created based on subscription limits
 * @param caId - The CA's user ID
 * @param resource - 'clients' | 'users' | 'credentials'
 * @returns LimitCheckResult with allowed status and details
 */
export async function checkSubscriptionLimit(
  caId: number,
  resource: 'clients' | 'users' | 'credentials'
): Promise<LimitCheckResult> {
  const plan = await getPlanLimits(caId);
  const usage = await calculateUsage(caId);

  let currentUsage = 0;
  let limit = 0;
  let resourceName = '';

  switch (resource) {
    case 'clients':
      currentUsage = usage.clients;
      limit = plan.maxClients;
      resourceName = 'clients';
      break;
    case 'users':
      currentUsage = usage.users;
      limit = plan.maxUsers;
      resourceName = 'team members';
      break;
    case 'credentials':
      currentUsage = usage.credentials;
      limit = plan.maxCredentials;
      resourceName = 'stored credentials';
      break;
  }

  // -1 means unlimited
  const allowed = limit === -1 || currentUsage < limit;

  return {
    allowed,
    currentUsage,
    limit,
    planName: plan.name,
    message: allowed
      ? 'OK'
      : `You've reached the maximum of ${limit} ${resourceName} on your ${plan.name} plan. Please upgrade to add more.`,
  };
}

