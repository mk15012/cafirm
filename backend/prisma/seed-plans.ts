import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    code: 'FREE',
    name: 'Starter',
    description: 'Perfect for trying out CA Firm Pro',
    monthlyPricePaise: 0,
    yearlyPricePaise: 0,
    maxClients: 3,
    maxFirmsPerClient: 2,
    maxUsers: 1,
    maxStorageMB: 100,
    maxCredentials: 5,
    features: JSON.stringify({
      taxCalculator: true,
      approvalWorkflow: false,
      activityLogs: false,
      documentManagement: true,
      invoiceManagement: true,
      meetings: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    }),
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    code: 'BASIC',
    name: 'Basic',
    description: 'For small CA practices',
    monthlyPricePaise: 49900,      // ₹499/month
    yearlyPricePaise: 499900,      // ₹4,999/year (save ₹999)
    maxClients: 15,
    maxFirmsPerClient: 5,
    maxUsers: 3,
    maxStorageMB: 1024,            // 1 GB
    maxCredentials: 25,
    features: JSON.stringify({
      taxCalculator: true,
      approvalWorkflow: true,
      activityLogs: false,
      documentManagement: true,
      invoiceManagement: true,
      meetings: true,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    }),
    isActive: true,
    isPopular: false,
    sortOrder: 2,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    description: 'For growing practices',
    monthlyPricePaise: 99900,      // ₹999/month
    yearlyPricePaise: 999900,      // ₹9,999/year (save ₹1,989)
    maxClients: 50,
    maxFirmsPerClient: 10,
    maxUsers: 10,
    maxStorageMB: 10240,           // 10 GB
    maxCredentials: 100,
    features: JSON.stringify({
      taxCalculator: true,
      approvalWorkflow: true,
      activityLogs: true,
      documentManagement: true,
      invoiceManagement: true,
      meetings: true,
      customBranding: true,
      apiAccess: false,
      prioritySupport: true,
    }),
    isActive: true,
    isPopular: true,
    sortOrder: 3,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large CA firms',
    monthlyPricePaise: 249900,     // ₹2,499/month
    yearlyPricePaise: 2499900,     // ₹24,999/year (save ₹4,989)
    maxClients: -1,                // Unlimited
    maxFirmsPerClient: -1,
    maxUsers: -1,
    maxStorageMB: 51200,           // 50 GB
    maxCredentials: -1,
    features: JSON.stringify({
      taxCalculator: true,
      approvalWorkflow: true,
      activityLogs: true,
      documentManagement: true,
      invoiceManagement: true,
      meetings: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    }),
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
];

async function main() {
  console.log('🌱 Seeding plans...');

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ ${plan.name} (${plan.code})`);
  }

  console.log('✅ Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

