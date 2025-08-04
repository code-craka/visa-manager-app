"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUser = exports.getUsersByRole = exports.getAllUsers = exports.updateUserRole = exports.getUserByEmail = exports.getUserById = exports.getDatabaseUserIdByNeonId = exports.getUserByNeonId = exports.createOrUpdateUser = void 0;
const db_js_1 = __importDefault(require("../db.js"));
// Create or update user when syncing with Neon Auth
const createOrUpdateUser = async (neonUserId, email, name, role = 'partner') => {
    try {
        // First try to find existing user
        const existingUser = await db_js_1.default.query('SELECT * FROM users WHERE neon_user_id = $1', [neonUserId]);
        if (existingUser.rows.length > 0) {
            // Update existing user
            const result = await db_js_1.default.query(`UPDATE users 
         SET email = $2, name = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE neon_user_id = $1 
         RETURNING *`, [neonUserId, email, name, role]);
            return result.rows[0];
        }
        else {
            // Create new user
            const result = await db_js_1.default.query(`INSERT INTO users (neon_user_id, email, name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`, [neonUserId, email, name, role]);
            return result.rows[0];
        }
    }
    catch (error) {
        console.error('Error creating/updating user:', error);
        throw new Error('Failed to create or update user');
    }
};
exports.createOrUpdateUser = createOrUpdateUser;
// Get user by Neon Auth ID
const getUserByNeonId = async (neonUserId) => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM users WHERE neon_user_id = $1', [neonUserId]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching user by Neon ID:', error);
        throw new Error('Failed to fetch user');
    }
};
exports.getUserByNeonId = getUserByNeonId;
// Get database user ID by Neon Auth ID - helper function for routes
const getDatabaseUserIdByNeonId = async (neonUserId) => {
    try {
        const result = await db_js_1.default.query('SELECT id FROM users WHERE neon_user_id = $1', [neonUserId]);
        return result.rows[0]?.id || null;
    }
    catch (error) {
        console.error('Error fetching database user ID by Neon ID:', error);
        throw new Error('Failed to fetch database user ID');
    }
};
exports.getDatabaseUserIdByNeonId = getDatabaseUserIdByNeonId;
// Get user by database ID
const getUserById = async (id) => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new Error('Failed to fetch user');
    }
};
exports.getUserById = getUserById;
// Get user by email
const getUserByEmail = async (email) => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching user by email:', error);
        throw new Error('Failed to fetch user');
    }
};
exports.getUserByEmail = getUserByEmail;
// Update user role (admin function)
const updateUserRole = async (userId, newRole) => {
    try {
        const result = await db_js_1.default.query(`UPDATE users 
       SET role = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`, [userId, newRole]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error updating user role:', error);
        throw new Error('Failed to update user role');
    }
};
exports.updateUserRole = updateUserRole;
// Get all users (admin function)
const getAllUsers = async () => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows;
    }
    catch (error) {
        console.error('Error fetching all users:', error);
        throw new Error('Failed to fetch users');
    }
};
exports.getAllUsers = getAllUsers;
// Get users by role
const getUsersByRole = async (role) => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
        return result.rows;
    }
    catch (error) {
        console.error('Error fetching users by role:', error);
        throw new Error('Failed to fetch users by role');
    }
};
exports.getUsersByRole = getUsersByRole;
// Delete user (admin function)
const deleteUser = async (userId) => {
    try {
        const result = await db_js_1.default.query('DELETE FROM users WHERE id = $1', [userId]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error deleting user:', error);
        throw new Error('Failed to delete user');
    }
};
exports.deleteUser = deleteUser;
// Get user statistics
const getUserStats = async () => {
    try {
        const result = await db_js_1.default.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'agency') as agency_count,
        COUNT(*) FILTER (WHERE role = 'partner') as partner_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
      FROM users
    `);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        throw new Error('Failed to fetch user statistics');
    }
};
exports.getUserStats = getUserStats;
//# sourceMappingURL=User.js.map