import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, assignFirm, unassignFirm } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('CA')); // Only CA can manage users

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/assign-firm', assignFirm);
router.delete('/:id/unassign-firm/:firmId', unassignFirm);

export default router;

