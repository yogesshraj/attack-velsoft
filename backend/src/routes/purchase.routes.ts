import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all purchase routes
router.use(authenticate);

// Get all purchases (authenticated users)
router.get('/', (req, res) => {
  // TODO: Implement get all purchases
  res.status(501).json({ message: 'Not implemented yet' });
});

// Get purchase by ID (authenticated users)
router.get('/:id', (req, res) => {
  // TODO: Implement get purchase by ID
  res.status(501).json({ message: 'Not implemented yet' });
});

// Create purchase (managers and admins)
router.post('/', authorize('ADMIN', 'MANAGER'), (req, res) => {
  // TODO: Implement create purchase
  res.status(501).json({ message: 'Not implemented yet' });
});

// Update purchase (managers and admins)
router.put('/:id', authorize('ADMIN', 'MANAGER'), (req, res) => {
  // TODO: Implement update purchase
  res.status(501).json({ message: 'Not implemented yet' });
});

// Delete purchase (admins only)
router.delete('/:id', authorize('ADMIN'), (req, res) => {
  // TODO: Implement delete purchase
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router; 