import pool from '../db.js';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'task' | 'payment' | 'urgent';
  read: boolean;
  created_at: Date;
}

// Create a new notification
export const createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: 'info' | 'task' | 'payment' | 'urgent' = 'info'
): Promise<Notification> => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, title, message, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Get all notifications for a user with pagination
export const getUserNotifications = async (
  userId: number,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; total: number; page: number; totalPages: number }> => {
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
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notificationsResult.rows,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: number,
  userId: number
): Promise<Notification> => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: number): Promise<number> => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    );
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw new Error('Failed to fetch unread notification count');
  }
};

// Delete notification
export const deleteNotification = async (
  notificationId: number,
  userId: number
): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

// Create task-related notifications
export const createTaskNotification = async (
  assigneeId: number,
  taskId: number,
  taskType: string,
  clientName: string,
  action: 'assigned' | 'updated' | 'completed'
): Promise<Notification> => {
  try {
    let title: string;
    let message: string;

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

    return await createNotification(assigneeId, title, message, 'task');
  } catch (error) {
    console.error('Error creating task notification:', error);
    throw new Error('Failed to create task notification');
  }
};

// Create payment-related notifications
export const createPaymentNotification = async (
  userId: number,
  amount: number,
  status: 'paid' | 'pending' | 'overdue'
): Promise<Notification> => {
  try {
    let title: string;
    let message: string;

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

    return await createNotification(userId, title, message, 'payment');
  } catch (error) {
    console.error('Error creating payment notification:', error);
    throw new Error('Failed to create payment notification');
  }
};

// Bulk create notifications for multiple users
export const bulkCreateNotifications = async (
  userIds: number[],
  title: string,
  message: string,
  type: 'info' | 'task' | 'payment' | 'urgent' = 'info'
): Promise<Notification[]> => {
  try {
    const values = userIds.map((userId, index) =>
      `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
    ).join(', ');

    const params = userIds.flatMap(userId => [userId, title, message, type]);

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ${values} 
       RETURNING *`,
      params
    );

    return result.rows;
  } catch (error) {
    console.error('Error bulk creating notifications:', error);
    throw new Error('Failed to bulk create notifications');
  }
};

// Clean up old notifications (older than 30 days)
export const cleanupOldNotifications = async (): Promise<number> => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE created_at < CURRENT_DATE - INTERVAL '30 days' 
       AND read = true`
    );
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new Error('Failed to cleanup old notifications');
  }
};
