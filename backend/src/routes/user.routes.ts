import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('ADMIN'), (req, res) => {
  // TODO: Implement get all users
  res.status(501).json({ message: 'Not implemented yet' });
});

// Get user by ID (admin or self)
router.get('/:id', (req, res) => {
  // TODO: Implement get user by ID
  res.status(501).json({ message: 'Not implemented yet' });
});

// Update user (admin or self)
router.put('/:id', (req, res) => {
  // TODO: Implement update user
  res.status(501).json({ message: 'Not implemented yet' });
});

// Delete user (admin only)
router.delete('/:id', authorize('ADMIN'), (req, res) => {
  // TODO: Implement delete user
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router; 