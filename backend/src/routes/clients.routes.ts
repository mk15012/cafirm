import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient, getClientDeadlines } from '../controllers/clients.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.get('/:id/deadlines', getClientDeadlines);
// Only CA can create, update, or delete clients
router.post('/', authorize('CA'), createClient);
router.put('/:id', authorize('CA'), updateClient);
router.delete('/:id', authorize('CA'), deleteClient);

export default router;

