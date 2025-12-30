const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetUserPassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node reset-user-password.js <email> <new-password>');
    console.log('Example: node reset-user-password.js "ramesh@cafirm.com" "password123"');
    process.exit(1);
  }

  const [email, password] = args;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and ensure status is ACTIVE
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        status: 'ACTIVE',
      },
    });

    console.log('✅ User password reset successfully!');
    console.log('');
    console.log('User Details:');
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  Status: ${updatedUser.status}`);
    console.log('');
    console.log('🎉 You can now login with:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();

