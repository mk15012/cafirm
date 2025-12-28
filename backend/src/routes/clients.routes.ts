import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient } from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;

