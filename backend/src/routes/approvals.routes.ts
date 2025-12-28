import { Router } from 'express';
import { getApprovals, getApproval, createApproval, approveRequest, rejectRequest } from '../controllers/approvals.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getApprovals);
router.get('/:id', getApproval);
router.post('/', createApproval);
router.put('/:id/approve', authorize('CA', 'MANAGER'), approveRequest);
router.put('/:id/reject', authorize('CA', 'MANAGER'), rejectRequest);

export default router;

