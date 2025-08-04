"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// Sync user with Neon Auth - called after Neon Auth authentication
router.post('/sync-user', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const { role = 'partner' } = req.body;
        const neonUser = req.user;
        // Create or update user in our database
        const user = await (0, User_js_1.createOrUpdateUser)(neonUser.id, neonUser.email, neonUser.displayName, role);
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
    }
    catch (error) {
        console.error('User sync error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});
// Get current user profile
router.get('/profile', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const neonUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(neonUser.id);
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
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update user role (admin only)
router.patch('/role', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        const currentUser = req.user;
        // Get current user from database to check role
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        // Update the target user's role
        const result = await db_js_1.default.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [newRole, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            user: result.rows[0]
        });
    }
    catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
// Get all users (agency only)
router.get('/users', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        const result = await db_js_1.default.query('SELECT id, neon_user_id, email, name, role, created_at FROM users ORDER BY created_at DESC');
        res.json({
            users: result.rows
        });
    }
    catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map