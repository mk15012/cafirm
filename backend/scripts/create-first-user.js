const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node create-first-user.js <name> <email> <password>');
    console.log('Example: node create-first-user.js "Ramesh Kumar" "ramesh@cafirm.com" "password123"');
    process.exit(1);
  }

  const [name, email, password] = args;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('❌ User with this email already exists!');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CA',
        status: 'ACTIVE',
      },
    });

    console.log('✅ First CA user created successfully!');
    console.log('');
    console.log('User Details:');
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log('');
    console.log('🎉 You can now login at http://localhost:3000');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstUser();

