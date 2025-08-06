import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

interface DbUser {
  id: number;
  clerk_user_id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Sync user with Clerk - called after Clerk authentication
router.post('/sync-user', requireAuth, async (req, res) => {
  try {
    const { role = 'partner' } = req.body;
    const clerkUser = req.user!;

    // Use database connection with RLS

    // Check if user already exists
    const existingUsersResult = await pool.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [clerkUser.id]
    );
    const existingUsers = existingUsersResult.rows as DbUser[];

    let user: DbUser;
    if (existingUsers.length === 0) {
      // Create new user
      const newUserResult = await pool.query(
        'INSERT INTO users (clerk_user_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [clerkUser.id, clerkUser.email, clerkUser.displayName, role]
      );
      
      if (!newUserResult.rows[0]) {
        throw new Error('Failed to create user');
      }
      user = newUserResult.rows[0] as DbUser;
    } else {
      // Update existing user
      const updatedUserResult = await pool.query(
        'UPDATE users SET name = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE clerk_user_id = $3 RETURNING *',
        [clerkUser.displayName, role, clerkUser.id]
      );
      
      if (!updatedUserResult.rows[0]) {
        throw new Error('Failed to update user');
      }
      user = updatedUserResult.rows[0] as DbUser;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        clerkUserId: user.clerk_user_id,
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
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const clerkUser = req.user!;

    const usersResult = await pool.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [clerkUser.id]
    );
    const users = usersResult.rows as DbUser[];

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        clerkUserId: user.clerk_user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user role (agency only)
router.patch('/role', requireAuth, async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const currentUser = req.user!;

    // Check if current user is agency
    const currentUsersResult = await pool.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [currentUser.id]
    );
    const currentUsers = currentUsersResult.rows as DbUser[];

    if (currentUsers.length === 0 || !currentUsers[0] || currentUsers[0].role !== 'agency') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update the target user's role (using admin pool for cross-user updates)
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
router.get('/users', requireAuth, async (req, res) => {
  try {
    const currentUser = req.user!;

    // Check if current user is agency
    const currentUsersResult = await pool.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [currentUser.id]
    );
    const currentUsers = currentUsersResult.rows as DbUser[];

    if (currentUsers.length === 0 || !currentUsers[0] || currentUsers[0].role !== 'agency') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Use admin pool to get all users (agencies can see all users)
    const result = await pool.query('SELECT id, clerk_user_id, email, name, role, created_at FROM users ORDER BY created_at DESC');

    res.json({
      users: result.rows
    });
  } catch (error: any) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;