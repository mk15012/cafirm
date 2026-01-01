import { Router } from 'express';
import { login, signup, register, getMe, changePassword, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter, sensitiveOpsLimiter } from '../middleware/rateLimiter';
import { loginValidator, signupValidator, changePasswordValidator } from '../middleware/validators';

const router = Router();

// Public routes with stricter rate limiting
router.post('/login', authLimiter, loginValidator, login);
router.post('/signup', authLimiter, signupValidator, signup); // Public signup for new CAs

// Authenticated routes
router.post('/register', authenticate, signupValidator, register); // Authenticated user creation (for CAs to create staff/manager)
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile); // Update own profile
router.post('/change-password', authenticate, sensitiveOpsLimiter, changePasswordValidator, changePassword);

export default router;

