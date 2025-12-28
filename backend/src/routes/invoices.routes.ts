import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, payInvoice } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.put('/:id/pay', payInvoice);

export default router;

