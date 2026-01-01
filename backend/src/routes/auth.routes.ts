import { Router } from 'express';
import { login, signup, register, getMe, changePassword, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/signup', signup); // Public signup for new CAs
router.post('/register', authenticate, register); // Authenticated user creation (for CAs to create staff/manager)
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile); // Update own profile
router.post('/change-password', authenticate, changePassword);

export default router;

