import { Router } from 'express';
import { createOrUpdateUser, getUserByNeonId } from '../models/User.js';
import { verifyNeonAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// Sync user with Neon Auth - called after Neon Auth authentication
router.post('/sync-user', verifyNeonAuth, async (req, res) => {
  try {
    const { role = 'partner' } = req.body;
    const neonUser = req.user!;

    // Create or update user in our database
    const user = await createOrUpdateUser(
      neonUser.id,
      neonUser.email,
      neonUser.displayName,
      role
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        neonUserId: user.neon_user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Get current user profile
router.get('/profile', verifyNeonAuth, async (req, res) => {
  try {
    const neonUser = req.user!;
    const user = await getUserByNeonId(neonUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({
      id: user.id,
      neonUserId: user.neon_user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user role (admin only)
router.patch('/role', verifyNeonAuth, async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const currentUser = req.user!;

    // Get current user from database to check role
    const user = await getUserByNeonId(currentUser.id);

    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update the target user's role
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newRole, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get all users (agency only)
router.get('/users', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query('SELECT id, neon_user_id, email, name, role, created_at FROM users ORDER BY created_at DESC');

    res.json({
      users: result.rows
    });
  } catch (error: any) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;