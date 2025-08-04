"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskNotification = void 0;
const express_1 = require("express");
const db_js_1 = __importDefault(require("../db.js"));
const auth_js_1 = require("../middleware/auth.js");
const User_js_1 = require("../models/User.js");
const router = (0, express_1.Router)();
// Get all notifications for current user
router.get('/', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const notifications = await db_js_1.default.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
        res.json(notifications.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get unread notification count
router.get('/unread/count', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const result = await db_js_1.default.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', [user.id]);
        res.json({ unreadCount: parseInt(result.rows[0].count) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a notification (for system use)
router.post('/', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const { user_id, title, message, type, related_id } = req.body;
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        // Only agencies can create notifications
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Only agencies can create notifications' });
        }
        const newNotification = await db_js_1.default.query('INSERT INTO notifications (user_id, title, message, type, related_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [user_id, title, message, type, related_id]);
        res.json(newNotification.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Mark a notification as read
router.put('/:notificationId/read', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Ensure user can only mark their own notifications as read
        const updatedNotification = await db_js_1.default.query('UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *', [notificationId, user.id]);
        if (updatedNotification.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or access denied' });
        }
        res.json(updatedNotification.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Mark all notifications as read
router.put('/read-all', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const result = await db_js_1.default.query('UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = FALSE RETURNING COUNT(*)', [user.id]);
        res.json({ message: 'All notifications marked as read', updatedCount: result.rowCount });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a notification
router.delete('/:notificationId', auth_js_1.verifyNeonAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const currentUser = req.user;
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const deletedNotification = await db_js_1.default.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *', [notificationId, user.id]);
        if (deletedNotification.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or access denied' });
        }
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Helper function to create task-related notifications
const createTaskNotification = async (userId, title, message, type, taskId) => {
    try {
        await db_js_1.default.query('INSERT INTO notifications (user_id, title, message, type, related_id) VALUES ($1, $2, $3, $4, $5)', [userId, title, message, type, taskId]);
    }
    catch (error) {
        console.error('Error creating notification:', error);
    }
};
exports.createTaskNotification = createTaskNotification;
exports.default = router;
//# sourceMappingURL=notifications.js.map