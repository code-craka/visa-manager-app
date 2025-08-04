"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldNotifications = exports.bulkCreateNotifications = exports.createPaymentNotification = exports.createTaskNotification = exports.deleteNotification = exports.getUnreadNotificationCount = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotification = void 0;
const db_js_1 = __importDefault(require("../db.js"));
// Create a new notification
const createNotification = async (userId, title, message, type = 'info') => {
    try {
        const result = await db_js_1.default.query(`INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`, [userId, title, message, type]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
};
exports.createNotification = createNotification;
// Get all notifications for a user with pagination
const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
    try {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
        let params = [userId];
        if (unreadOnly) {
            query += ' AND read = false';
            countQuery += ' AND read = false';
        }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const [notificationsResult, countResult] = await Promise.all([
            db_js_1.default.query(query, [...params, limit, offset]),
            db_js_1.default.query(countQuery, params)
        ]);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        return {
            notifications: notificationsResult.rows,
            total,
            page,
            totalPages
        };
    }
    catch (error) {
        console.error('Error fetching user notifications:', error);
        throw new Error('Failed to fetch notifications');
    }
};
exports.getUserNotifications = getUserNotifications;
// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const result = await db_js_1.default.query(`UPDATE notifications 
       SET read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`, [notificationId, userId]);
        if (result.rows.length === 0) {
            throw new Error('Notification not found or access denied');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (userId) => {
    try {
        const result = await db_js_1.default.query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [userId]);
        return result.rowCount || 0;
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Get unread notification count
const getUnreadNotificationCount = async (userId) => {
    try {
        const result = await db_js_1.default.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false', [userId]);
        return parseInt(result.rows[0].count);
    }
    catch (error) {
        console.error('Error fetching unread notification count:', error);
        throw new Error('Failed to fetch unread notification count');
    }
};
exports.getUnreadNotificationCount = getUnreadNotificationCount;
// Delete notification
const deleteNotification = async (notificationId, userId) => {
    try {
        const result = await db_js_1.default.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
    }
};
exports.deleteNotification = deleteNotification;
// Create task-related notifications
const createTaskNotification = async (assigneeId, taskId, taskType, clientName, action) => {
    try {
        let title;
        let message;
        switch (action) {
            case 'assigned':
                title = 'New Task Assigned';
                message = `You have been assigned a new ${taskType} task for client ${clientName}`;
                break;
            case 'updated':
                title = 'Task Updated';
                message = `Task ${taskType} for client ${clientName} has been updated`;
                break;
            case 'completed':
                title = 'Task Completed';
                message = `Task ${taskType} for client ${clientName} has been marked as completed`;
                break;
        }
        return await (0, exports.createNotification)(assigneeId, title, message, 'task');
    }
    catch (error) {
        console.error('Error creating task notification:', error);
        throw new Error('Failed to create task notification');
    }
};
exports.createTaskNotification = createTaskNotification;
// Create payment-related notifications
const createPaymentNotification = async (userId, amount, status) => {
    try {
        let title;
        let message;
        switch (status) {
            case 'paid':
                title = 'Payment Received';
                message = `Payment of $${amount} has been processed`;
                break;
            case 'pending':
                title = 'Payment Pending';
                message = `Payment of $${amount} is pending processing`;
                break;
            case 'overdue':
                title = 'Payment Overdue';
                message = `Payment of $${amount} is overdue`;
                break;
        }
        return await (0, exports.createNotification)(userId, title, message, 'payment');
    }
    catch (error) {
        console.error('Error creating payment notification:', error);
        throw new Error('Failed to create payment notification');
    }
};
exports.createPaymentNotification = createPaymentNotification;
// Bulk create notifications for multiple users
const bulkCreateNotifications = async (userIds, title, message, type = 'info') => {
    try {
        const values = userIds.map((userId, index) => `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`).join(', ');
        const params = userIds.flatMap(userId => [userId, title, message, type]);
        const result = await db_js_1.default.query(`INSERT INTO notifications (user_id, title, message, type) 
       VALUES ${values} 
       RETURNING *`, params);
        return result.rows;
    }
    catch (error) {
        console.error('Error bulk creating notifications:', error);
        throw new Error('Failed to bulk create notifications');
    }
};
exports.bulkCreateNotifications = bulkCreateNotifications;
// Clean up old notifications (older than 30 days)
const cleanupOldNotifications = async () => {
    try {
        const result = await db_js_1.default.query(`DELETE FROM notifications 
       WHERE created_at < CURRENT_DATE - INTERVAL '30 days' 
       AND read = true`);
        return result.rowCount || 0;
    }
    catch (error) {
        console.error('Error cleaning up old notifications:', error);
        throw new Error('Failed to cleanup old notifications');
    }
};
exports.cleanupOldNotifications = cleanupOldNotifications;
//# sourceMappingURL=Notification.js.map