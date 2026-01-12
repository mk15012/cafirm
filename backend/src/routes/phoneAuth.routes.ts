import { Router } from 'express';
import { phoneLogin, phoneRegister, linkPhone, checkPhone } from '../controllers/phoneAuth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.post('/login', phoneLogin);
router.post('/register', phoneRegister);
router.get('/check', checkPhone);

// Protected route (requires existing auth)
router.post('/link', authenticate, linkPhone);

export default router;


