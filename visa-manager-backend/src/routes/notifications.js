"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// Get all notifications for a user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await db_js_1.default.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(notifications.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Mark a notification as read
router.put('/:notificationId/read', async (req, res) => {
    const { notificationId } = req.params;
    try {
        const updatedNotification = await db_js_1.default.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *', [notificationId]);
        res.json(updatedNotification.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map