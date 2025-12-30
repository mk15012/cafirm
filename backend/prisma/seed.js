const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.userFirmMapping.deleteMany();
  await prisma.firm.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const ca = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar',
      email: 'ramesh@cafirm.com',
      password: hashedPassword,
      role: 'CA',
      status: 'ACTIVE',
      phone: '+91-9876543210',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@cafirm.com',
      password: hashedPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      phone: '+91-9876543211',
      reportsToId: ca.id,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      name: 'Raj Kumar',
      email: 'raj@cafirm.com',
      password: hashedPassword,
      role: 'STAFF',
      status: 'ACTIVE',
      phone: '+91-9876543212',
      reportsToId: manager.id,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: 'Anita Singh',
      email: 'anita@cafirm.com',
      password: hashedPassword,
      role: 'STAFF',
      status: 'ACTIVE',
      phone: '+91-9876543213',
      reportsToId: manager.id,
    },
  });

  console.log(`✅ Created ${4} users\n`);

  // Create Clients
  console.log('👤 Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      name: 'ABC Traders Pvt Ltd',
      contactPerson: 'Mr. Amit Patel',
      email: 'amit@abctraders.com',
      phone: '+91-9876500001',
      address: '123 Business Street, Mumbai, Maharashtra',
      notes: 'Regular client, GST filing monthly',
      createdById: ca.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'XYZ Industries',
      contactPerson: 'Ms. Sunita Mehta',
      email: 'sunita@xyzindustries.com',
      phone: '+91-9876500002',
      address: '456 Industrial Area, Delhi',
      notes: 'Large client, multiple firms',
      createdById: ca.id,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'DEF Enterprises',
      contactPerson: 'Mr. Rohit Gupta',
      email: 'rohit@defenterprises.com',
      phone: '+91-9876500003',
      address: '789 Corporate Park, Bangalore, Karnataka',
      createdById: ca.id,
    },
  });

  console.log(`✅ Created ${3} clients\n`);

  // Create Firms
  console.log('🏢 Creating firms...');
  const firm1 = await prisma.firm.create({
    data: {
      clientId: client1.id,
      name: 'ABC Traders Pvt Ltd',
      panNumber: 'ABCDE1234F',
      gstNumber: '27ABCDE1234F1Z5',
      registrationNumber: 'U12345MH2020PTC123456',
      address: '123 Business Street, Mumbai, Maharashtra',
      status: 'Active',
      createdById: ca.id,
    },
  });

  const firm2 = await prisma.firm.create({
    data: {
      clientId: client2.id,
      name: 'XYZ Industries - Main',
      panNumber: 'XYZAB5678G',
      gstNumber: '07XYZAB5678G2Z6',
      registrationNumber: 'U23456DL2021PTC234567',
      address: '456 Industrial Area, Delhi',
      status: 'Active',
      createdById: ca.id,
    },
  });

  const firm3 = await prisma.firm.create({
    data: {
      clientId: client2.id,
      name: 'XYZ Industries - Branch',
      panNumber: 'XYZCD9012H',
      gstNumber: '29XYZCD9012H3Z7',
      registrationNumber: 'U34567DL2021PTC345678',
      address: '789 Branch Office, Delhi',
      status: 'Active',
      createdById: ca.id,
    },
  });

  const firm4 = await prisma.firm.create({
    data: {
      clientId: client3.id,
      name: 'DEF Enterprises',
      panNumber: 'DEFGH3456I',
      gstNumber: '29DEFGH3456I4Z8',
      registrationNumber: 'U45678KA2022PTC456789',
      address: '789 Corporate Park, Bangalore, Karnataka',
      status: 'Active',
      createdById: ca.id,
    },
  });

  console.log(`✅ Created ${4} firms\n`);

  // Assign firms to staff
  console.log('🔗 Assigning firms to staff...');
  await prisma.userFirmMapping.create({
    data: {
      userId: staff1.id,
      firmId: firm1.id,
      assignedById: manager.id,
    },
  });

  await prisma.userFirmMapping.create({
    data: {
      userId: staff1.id,
      firmId: firm2.id,
      assignedById: manager.id,
    },
  });

  await prisma.userFirmMapping.create({
    data: {
      userId: staff2.id,
      firmId: firm3.id,
      assignedById: manager.id,
    },
  });

  await prisma.userFirmMapping.create({
    data: {
      userId: staff2.id,
      firmId: firm4.id,
      assignedById: manager.id,
    },
  });

  console.log(`✅ Assigned firms to staff\n`);

  // Create Tasks
  console.log('✅ Creating tasks...');
  const now = new Date();
  const tasks = [
    {
      firmId: firm1.id,
      title: 'GST Return Filing - March 2024',
      description: 'Complete GSTR-1 and GSTR-3B filing for March',
      assignedToId: staff1.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
      createdById: manager.id,
    },
    {
      firmId: firm1.id,
      title: 'TDS Quarterly Return - Q4',
      description: 'File TDS return for Q4 FY 2023-24',
      assignedToId: staff1.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      createdById: manager.id,
    },
    {
      firmId: firm2.id,
      title: 'ITR Filing - AY 2023-24',
      description: 'Individual tax return filing',
      assignedToId: staff1.id,
      status: 'AWAITING_APPROVAL',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (overdue)
      createdById: manager.id,
    },
    {
      firmId: firm2.id,
      title: 'ROC Annual Filing',
      description: 'File annual return with ROC',
      assignedToId: staff1.id,
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
    },
    {
      firmId: firm3.id,
      title: 'GST Return Filing - April 2024',
      description: 'Complete GSTR-1 and GSTR-3B filing for April',
      assignedToId: staff2.id,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: manager.id,
    },
    {
      firmId: firm4.id,
      title: 'Income Tax Assessment',
      description: 'Prepare documents for income tax assessment',
      assignedToId: staff2.id,
      status: 'PENDING',
      priority: 'LOW',
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdById: manager.id,
    },
  ];

  const createdTasks = [];
  for (const task of tasks) {
    const created = await prisma.task.create({ data: task });
    createdTasks.push(created);
  }

  console.log(`✅ Created ${createdTasks.length} tasks\n`);

  // Create Approvals
  console.log('🔐 Creating approvals...');
  const approvalTask = createdTasks.find(t => t.status === 'AWAITING_APPROVAL');
  if (approvalTask) {
    await prisma.approval.create({
      data: {
        taskId: approvalTask.id,
        requestedById: staff1.id,
        status: 'PENDING',
        remarks: 'Please review and approve ITR filing',
      },
    });
  }
  console.log(`✅ Created ${1} approval request\n`);

  // Create Invoices
  console.log('💰 Creating invoices...');
  const invoices = [
    {
      firmId: firm1.id,
      invoiceNumber: 'INV-2024-0001',
      amount: 50000,
      taxAmount: 9000,
      totalAmount: 59000,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'UNPAID',
      createdById: ca.id,
    },
    {
      firmId: firm1.id,
      invoiceNumber: 'INV-2024-0002',
      amount: 75000,
      taxAmount: 13500,
      totalAmount: 88500,
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Overdue
      status: 'OVERDUE',
      createdById: ca.id,
    },
    {
      firmId: firm2.id,
      invoiceNumber: 'INV-2024-0003',
      amount: 100000,
      taxAmount: 18000,
      totalAmount: 118000,
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      paidDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      paymentReference: 'TXN123456789',
      createdById: ca.id,
    },
    {
      firmId: firm2.id,
      invoiceNumber: 'INV-2024-0004',
      amount: 60000,
      taxAmount: 10800,
      totalAmount: 70800,
      dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      status: 'UNPAID',
      createdById: ca.id,
    },
    {
      firmId: firm3.id,
      invoiceNumber: 'INV-2024-0005',
      amount: 45000,
      taxAmount: 8100,
      totalAmount: 53100,
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      paidDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      paymentReference: 'TXN987654321',
      createdById: ca.id,
    },
  ];

  for (const invoice of invoices) {
    await prisma.invoice.create({ data: invoice });
  }

  console.log(`✅ Created ${invoices.length} invoices\n`);

  // Create Activity Logs
  console.log('📋 Creating activity logs...');
  const activities = [
    { userId: ca.id, actionType: 'CREATE', entityType: 'Client', entityId: String(client1.id), description: 'Created client ABC Traders Pvt Ltd' },
    { userId: ca.id, actionType: 'CREATE', entityType: 'Firm', entityId: String(firm1.id), description: 'Created firm ABC Traders Pvt Ltd' },
    { userId: manager.id, actionType: 'CREATE', entityType: 'Task', entityId: String(createdTasks[0].id), description: 'Created task GST Return Filing' },
    { userId: staff1.id, actionType: 'UPDATE', entityType: 'Task', entityId: String(createdTasks[0].id), description: 'Updated task status to IN_PROGRESS' },
  ];

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: {
        ...activity,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    });
  }

  console.log(`✅ Created ${activities.length} activity logs\n`);

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   👥 Users: 4 (1 CA, 1 Manager, 2 Staff)`);
  console.log(`   👤 Clients: 3`);
  console.log(`   🏢 Firms: 4`);
  console.log(`   ✅ Tasks: ${createdTasks.length}`);
  console.log(`   🔐 Approvals: 1`);
  console.log(`   💰 Invoices: ${invoices.length}`);
  console.log(`   📋 Activity Logs: ${activities.length}\n`);
  console.log('🔑 Login Credentials (all users):');
  console.log('   Email: ramesh@cafirm.com (CA)');
  console.log('   Email: priya@cafirm.com (Manager)');
  console.log('   Email: raj@cafirm.com (Staff)');
  console.log('   Email: anita@cafirm.com (Staff)');
  console.log('   Password: password123 (for all)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

