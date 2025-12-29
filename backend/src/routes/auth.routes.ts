import { Router } from 'express';
import { login, register, getMe, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, register);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;

