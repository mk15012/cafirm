import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCredentials,
  getCredential,
  createCredential,
  updateCredential,
  deleteCredential,
} from '../controllers/credentials.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCredentials);
router.get('/:id', getCredential);
router.post('/', createCredential);
router.put('/:id', updateCredential);
router.delete('/:id', deleteCredential);

export default router;

