import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } from '../controllers/invoiceController';
import { protect, authorizeOwner } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all invoice routes
router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.route('/:id/status')
  .patch(updateInvoiceStatus);

export default router;
