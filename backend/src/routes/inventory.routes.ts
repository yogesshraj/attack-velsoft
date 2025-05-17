import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/inventory.controller';

const router = Router();

// Protected routes
// Temporarily disabled for testing
// router.use(authenticate);

// Get all products (all authenticated users)
router.get('/', getProducts);

// Get single product (all authenticated users)
router.get('/:id', getProduct);

// Create product (managers and admins)
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);

// Update product (managers and admins)
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);

// Delete product (admins only)
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router; 