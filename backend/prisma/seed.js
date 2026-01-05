const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Seed Subscription Plans
  console.log('💳 Creating subscription plans...');
  const plans = [
    {
      code: 'FREE',
      name: 'Starter',
      description: 'Perfect for individual CAs just getting started',
      monthlyPricePaise: 0,
      yearlyPricePaise: 0,
      maxClients: 10,
      maxFirmsPerClient: 10, // Limited to encourage upgrade
      maxUsers: 2,
      maxStorageMB: 512, // 512MB
      maxCredentials: 20,
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
      sortOrder: 0,
    },
    {
      code: 'BASIC',
      name: 'Basic',
      description: 'For small CA practices with growing client base',
      monthlyPricePaise: 49900, // ₹499
      yearlyPricePaise: 499900, // ₹4,999 (2 months free)
      maxClients: 50,
      maxFirmsPerClient: 50,
      maxUsers: 5,
      maxStorageMB: 5120, // 5GB
      maxCredentials: 100,
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
      sortOrder: 1,
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional',
      description: 'For established CA firms with multiple team members',
      monthlyPricePaise: 99900, // ₹999
      yearlyPricePaise: 999900, // ₹9,999 (2 months free)
      maxClients: 200,
      maxFirmsPerClient: 200,
      maxUsers: 15,
      maxStorageMB: 20480, // 20GB
      maxCredentials: 400,
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
      sortOrder: 2,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'For large CA firms with unlimited needs',
      monthlyPricePaise: 249900, // ₹2,499
      yearlyPricePaise: 2499900, // ₹24,999 (2 months free)
      maxClients: -1, // Unlimited
      maxFirmsPerClient: -1, // Unlimited
      maxUsers: -1, // Unlimited
      maxStorageMB: 51200, // 50GB
      maxCredentials: -1, // Unlimited
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
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log(`✅ Created ${plans.length} subscription plans\n`);

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   💳 Subscription Plans: ${plans.length} (FREE, BASIC, PROFESSIONAL, ENTERPRISE)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
