import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { generateTaxDeadlineTasks, getCurrentFinancialYear } from '../utils/taxDeadlines';
import { sendPasswordResetEmail, isEmailConfigured } from '../utils/email';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine the user role (CA or INDIVIDUAL for self-signup)
    const userRole = role === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'CA';

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
        status: 'ACTIVE',
      },
    });

    // For INDIVIDUAL users, create personal client, firm, and tax deadline tasks
    if (userRole === 'INDIVIDUAL') {
      try {
        // Create personal client
        const client = await prisma.client.create({
          data: {
            name: `${name}'s Personal Finances`,
            contactPerson: name,
            email: email,
            phone: phone || null,
            notes: 'Auto-created for personal tax management',
            createdById: user.id,
          },
        });

        // Create personal firm
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

        // Generate and create tax deadline tasks
        const currentFY = getCurrentFinancialYear();
        const taskData = generateTaxDeadlineTasks(firm.id, user.id, currentFY);
        
        if (taskData.length > 0) {
          await prisma.task.createMany({
            data: taskData,
          });
        }

        console.log(`Created ${taskData.length} tax deadline tasks for INDIVIDUAL user: ${email}`);
      } catch (setupError) {
        console.error('Error setting up INDIVIDUAL user data:', setupError);
        // Don't fail the signup, just log the error
      }
    }

    // Generate token and return
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone, role, reportsToId } = req.body;
    const authUser = (req as AuthRequest).user;

    // Only CA can create users
    if (authUser?.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can create users' });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        reportsToId,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        role: true,
        status: true,
        profilePicture: true,
        reportsToId: true,
        reportsTo: {
          select: {
            id: true,
            name: true,
          },
        },
        firmAssignments: {
          include: {
            firm: {
              include: {
                client: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    res.json(userData);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get the user with password
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, userData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// In-memory store for password reset tokens (in production, use Redis or DB)
const resetTokens: Map<string, { email: string; token: string; expiresAt: Date }> = new Map();

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // In development, tell user the email doesn't exist (helpful for testing)
      // In production, don't reveal if user exists or not (security)
      if (!isEmailConfigured()) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }
      // For production: generic message to prevent email enumeration
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the reset token
    resetTokens.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      token: resetCode,
      expiresAt,
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetCode, user.name);
    
    if (emailSent) {
      console.log(`✅ Password reset email sent to ${email}`);
    } else {
      console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
    }

    res.json({ 
      message: 'If an account exists with this email, a reset code has been sent.',
      // In development without email configured, show the code for testing
      ...(!isEmailConfigured() && { resetCode }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get and validate reset token
    const storedToken = resetTokens.get(email.toLowerCase());

    if (!storedToken) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (storedToken.token !== resetCode) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date() > storedToken.expiresAt) {
      resetTokens.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });

    // Remove used token
    resetTokens.delete(email.toLowerCase());

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, phone, birthday } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Parse birthday if provided
    let birthdayDate: Date | null = null;
    if (birthday) {
      birthdayDate = new Date(birthday);
      if (isNaN(birthdayDate.getTime())) {
        return res.status(400).json({ error: 'Invalid birthday format' });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        birthday: birthdayDate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        role: true,
        status: true,
        createdAt: true,
        reportsTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

