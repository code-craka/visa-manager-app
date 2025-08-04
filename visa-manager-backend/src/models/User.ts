import pool from '../db.js';

export interface User {
  id: number;
  neon_user_id: string;
  email: string;
  name: string;
  role: 'agency' | 'partner';
  created_at: Date;
  updated_at: Date;
}

// Create or update user when syncing with Neon Auth
export const createOrUpdateUser = async (
  neonUserId: string,
  email: string,
  name: string,
  role: 'agency' | 'partner' = 'partner'
): Promise<User> => {
  try {
    // First try to find existing user
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE neon_user_id = $1',
      [neonUserId]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      const result = await pool.query(
        `UPDATE users 
         SET email = $2, name = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE neon_user_id = $1 
         RETURNING *`,
        [neonUserId, email, name, role]
      );
      return result.rows[0];
    } else {
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (neon_user_id, email, name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [neonUserId, email, name, role]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create or update user');
  }
};

// Get user by Neon Auth ID
export const getUserByNeonId = async (neonUserId: string): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE neon_user_id = $1',
      [neonUserId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by Neon ID:', error);
    throw new Error('Failed to fetch user');
  }
};

// Get database user ID by Neon Auth ID - helper function for routes
export const getDatabaseUserIdByNeonId = async (neonUserId: string): Promise<number | null> => {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE neon_user_id = $1',
      [neonUserId]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Error fetching database user ID by Neon ID:', error);
    throw new Error('Failed to fetch database user ID');
  }
};

// Get user by database ID
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user');
  }
};

// Update user role (admin function)
export const updateUserRole = async (
  userId: number,
  newRole: 'agency' | 'partner'
): Promise<User> => {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET role = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [userId, newRole]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Get users by role
export const getUsersByRole = async (role: 'agency' | 'partner'): Promise<User[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw new Error('Failed to fetch users by role');
  }
};

// Delete user (admin function)
export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'agency') as agency_count,
        COUNT(*) FILTER (WHERE role = 'partner') as partner_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
      FROM users
    `);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user statistics');
  }
};
