import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { verifyFirebaseToken } from '../utils/firebase';
import { hashPassword } from '../utils/bcrypt';
import { generateTaxDeadlineTasks, getCurrentFinancialYear } from '../utils/taxDeadlines';

/**
 * Normalize phone number for database lookup
 * Firebase sends +917326027500, but DB might have 7326027500 or +917326027500
 */
function normalizePhoneForLookup(phone: string): string[] {
  const variants: string[] = [phone];
  
  // If starts with +91, also search without it
  if (phone.startsWith('+91')) {
    variants.push(phone.substring(3)); // Remove +91
  }
  // If starts with 91 (without +), also search without it
  if (phone.startsWith('91') && phone.length === 12) {
    variants.push(phone.substring(2)); // Remove 91
  }
  // If it's a 10-digit number, also search with +91 prefix
  if (phone.length === 10 && !phone.startsWith('+')) {
    variants.push('+91' + phone);
  }
  
  return variants;
}

/**
 * Login/Register with Firebase Phone Auth
 * Client sends Firebase ID token after completing phone verification
 */
export async function phoneLogin(req: Request, res: Response) {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(firebaseToken);
    } catch (error: any) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired OTP token' });
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found in token' });
    }

    // Find user by phone number (try multiple formats)
    const phoneVariants = normalizePhoneForLookup(phoneNumber);
    const user = await prisma.user.findFirst({
      where: { 
        phone: { in: phoneVariants } 
      },
    });

    if (!user) {
      // User not registered - return info for registration
      return res.status(404).json({ 
        error: 'User not registered',
        needsRegistration: true,
        phoneNumber,
        firebaseUid: decodedToken.uid,
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    // Generate JWT token for our app
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Register a new user with phone number (after OTP verification)
 */
export async function phoneRegister(req: Request, res: Response) {
  try {
    const { firebaseToken, name, email, role } = req.body;

    if (!firebaseToken || !name || !email) {
      return res.status(400).json({ error: 'Firebase token, name, and email are required' });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(firebaseToken);
    } catch (error: any) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired OTP token' });
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found in token' });
    }

    // Check if phone already exists (try multiple formats)
    const phoneVariants = normalizePhoneForLookup(phoneNumber);
    const existingPhone = await prisma.user.findFirst({
      where: { phone: { in: phoneVariants } },
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate role
    const userRole = role === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'CA';

    // Create a random password (user will login via OTP)
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hashedPassword = await hashPassword(randomPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phoneNumber,
        role: userRole,
        status: 'ACTIVE',
      },
    });

    // For INDIVIDUAL users, create personal client, firm, and tax deadline tasks
    if (userRole === 'INDIVIDUAL') {
      try {
        const client = await prisma.client.create({
          data: {
            name: `${name}'s Personal Finances`,
            contactPerson: name,
            email: email.toLowerCase(),
            phone: phoneNumber,
            notes: 'Auto-created for personal tax management',
            createdById: user.id,
          },
        });

        const firm = await prisma.firm.create({
          data: {
            name: 'Personal',
            panNumber: 'PENDING',
            clientId: client.id,
            createdById: user.id,
            status: 'Active',
            entityType: 'INDIVIDUAL',
            hasITR: true,
          },
        });

        // Generate tax deadline tasks
        const currentFY = getCurrentFinancialYear();
        const taskData = generateTaxDeadlineTasks(firm.id, user.id, currentFY);
        
        if (taskData.length > 0) {
          await prisma.task.createMany({ data: taskData as any });
        }

        console.log(`Created ${taskData.length} tax deadline tasks for INDIVIDUAL user: ${email}`);
      } catch (setupError) {
        console.error('Error setting up INDIVIDUAL user data:', setupError);
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Phone register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Link phone number to existing account
 */
export async function linkPhone(req: Request, res: Response) {
  try {
    const { firebaseToken, email, password } = req.body;

    if (!firebaseToken || !email || !password) {
      return res.status(400).json({ error: 'Firebase token, email, and password are required' });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(firebaseToken);
    } catch (error: any) {
      return res.status(401).json({ error: 'Invalid or expired OTP token' });
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found in token' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if phone is already linked to another account (try multiple formats)
    const phoneVariants = normalizePhoneForLookup(phoneNumber);
    const existingPhone = await prisma.user.findFirst({
      where: { 
        phone: { in: phoneVariants },
        id: { not: user.id },
      },
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already linked to another account' });
    }

    // Update user with phone number
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: phoneNumber },
    });

    res.json({ 
      message: 'Phone number linked successfully',
      phone: phoneNumber,
    });
  } catch (error) {
    console.error('Link phone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check if phone number is registered
 */
export async function checkPhone(req: Request, res: Response) {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Try multiple phone formats
    const phoneVariants = normalizePhoneForLookup(phone);
    const user = await prisma.user.findFirst({
      where: { phone: { in: phoneVariants } },
      select: { id: true, name: true },
    });

    res.json({
      registered: !!user,
      userName: user?.name,
    });
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

