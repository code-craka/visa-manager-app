import { Router } from 'express';
import pool from '../db.js';
import { verifyNeonAuth } from '../middleware/auth.js';
import { getUserByNeonId } from '../models/User.js';

const router = Router();

// Get all notifications for current user
router.get('/', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    res.json(notifications.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get('/unread/count', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [user.id]
    );
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a notification (for system use)
router.post('/', verifyNeonAuth, async (req, res) => {
  try {
    const { user_id, title, message, type, related_id } = req.body;
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    // Only agencies can create notifications
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can create notifications' });
    }

    const newNotification = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, title, message, type, related_id]
    );

    res.json(newNotification.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a notification as read
router.put('/:notificationId/read', verifyNeonAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure user can only mark their own notifications as read
    const updatedNotification = await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, user.id]
    );

    if (updatedNotification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json(updatedNotification.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = FALSE RETURNING COUNT(*)',
      [user.id]
    );

    res.json({ message: 'All notifications marked as read', updatedCount: result.rowCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete('/:notificationId', verifyNeonAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedNotification = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, user.id]
    );

    if (deletedNotification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create task-related notifications
export const createTaskNotification = async (userId: number, title: string, message: string, type: string, taskId: number) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, message, type, taskId]
    );
  } catch (error: any) {
    console.error('Error creating notification:', error);
  }
};

export default router;