import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const notifications = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(notifications.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a notification as read
router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  try {
    const updatedNotification = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [notificationId]
    );
    res.json(updatedNotification.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;