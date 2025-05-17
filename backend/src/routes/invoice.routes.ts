import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all invoice routes
router.use(authenticate);

// Create a new invoice
router.post('/', createInvoice);

// Get all invoices
router.get('/', getInvoices);

// Get a specific invoice
router.get('/:id', getInvoiceById);

// Update an invoice
router.patch('/:id', updateInvoice);

// Delete an invoice
router.delete('/:id', deleteInvoice);

export default router; 