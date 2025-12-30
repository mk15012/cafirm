import { Router } from 'express';
import { getFirms, getFirm, createFirm, updateFirm, deleteFirm } from '../controllers/firms.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFirms);
router.get('/:id', getFirm);
router.post('/', createFirm);
router.put('/:id', updateFirm);
router.delete('/:id', deleteFirm);

export default router;

