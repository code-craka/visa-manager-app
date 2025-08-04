import { Router } from 'express';
import pool from '../db.js';
import { verifyNeonAuth } from '../middleware/auth.js';
import { getUserByNeonId, getDatabaseUserIdByNeonId } from '../models/User.js';

const router = Router();

// Create a new task (agency only)
router.post('/', verifyNeonAuth, async (req, res) => {
  try {
    const { client_id, assigned_to, task_type, description, commission, due_date } = req.body;
    const currentUser = req.user!;

    // Check if user is agency
    const user = await getUserByNeonId(currentUser.id);
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can create tasks' });
    }

    const newTask = await pool.query(
      'INSERT INTO tasks (client_id, assigned_to, created_by, task_type, description, commission, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [client_id, assigned_to, user.id, task_type, description, commission, due_date]
    );
    res.json(newTask.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = `
      SELECT t.*, c.name as client_name, c.passport, c.visa_type,
             u.name as partner_name, u.email as partner_email
      FROM tasks t
      JOIN clients c ON t.client_id = c.id
      JOIN users u ON t.assigned_to = u.id
    `;
    let params: any[] = [];

    // If user is a partner, only show tasks assigned to them
    if (user.role === 'partner') {
      query += ' WHERE t.assigned_to = $1';
      params.push(dbUserId);
    }

    query += ' ORDER BY t.created_at DESC';

    const allTasks = await pool.query(query, params);
    res.json(allTasks.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single task
router.get('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = `
      SELECT t.*, c.name as client_name, c.passport, c.visa_type, c.email as client_email,
             u.name as partner_name, u.email as partner_email
      FROM tasks t
      JOIN clients c ON t.client_id = c.id
      JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `;

    let params = [id];

    // If user is a partner, ensure they can only see their own tasks
    if (user.role === 'partner') {
      query += ' AND t.assigned_to = $2';
      params.push(dbUserId?.toString() || '0');
    }

    const task = await pool.query(query, params);

    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    res.json(task.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status (partners can update status, agencies can update everything)
router.put('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if task exists and user has access
    let taskQuery = 'SELECT * FROM tasks WHERE id = $1';
    let taskParams = [id];

    if (user.role === 'partner') {
      taskQuery += ' AND assigned_to = $2';
      taskParams.push(dbUserId?.toString() || "0");
    }

    const existingTask = await pool.query(taskQuery, taskParams);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const task = existingTask.rows[0];

    if (user.role === 'partner') {
      // Partners can only update status and add notes
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updatedTask = await pool.query(
        'UPDATE tasks SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, notes || task.notes, id]
      );

      res.json(updatedTask.rows[0]);
    } else {
      // Agencies can update everything
      const { client_id, assigned_to, task_type, description, status, commission, payment_status, due_date, notes } = req.body;

      const updatedTask = await pool.query(
        `UPDATE tasks SET 
         client_id = $1, assigned_to = $2, task_type = $3, description = $4, 
         status = $5, commission = $6, payment_status = $7, due_date = $8, 
         notes = $9, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $10 RETURNING *`,
        [
          client_id || task.client_id,
          assigned_to || task.assigned_to,
          task_type || task.task_type,
          description || task.description,
          status || task.status,
          commission || task.commission,
          payment_status || task.payment_status,
          due_date || task.due_date,
          notes || task.notes,
          id
        ]
      );

      res.json(updatedTask.rows[0]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark task as completed and calculate commission
router.patch('/:id/complete', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_notes } = req.body;
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if task exists and user has access
    let taskQuery = 'SELECT * FROM tasks WHERE id = $1';
    let taskParams = [id];

    if (user.role === 'partner') {
      taskQuery += ' AND assigned_to = $2';
      taskParams.push(dbUserId?.toString() || "0");
    }

    const existingTask = await pool.query(taskQuery, taskParams);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const task = existingTask.rows[0];

    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Task is already completed' });
    }

    const updatedTask = await pool.query(
      `UPDATE tasks SET 
       status = 'completed', 
       completion_date = CURRENT_TIMESTAMP,
       completion_notes = $1,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [completion_notes, id]
    );

    res.json({
      message: 'Task marked as completed',
      task: updatedTask.rows[0],
      commission_earned: task.commission
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task (agency only)
router.delete('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Check if user is agency
    const user = await getUserByNeonId(currentUser.id);
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can delete tasks' });
    }

    const deletedTask = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', task: deletedTask.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get commission report for a partner
router.get('/partner/:partnerId/commission-report', verifyNeonAuth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Partners can only see their own reports, agencies can see all
    if (user.role === 'partner' && user.id.toString() !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const commissionData = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
         SUM(CASE WHEN status = 'completed' THEN commission ELSE 0 END) as total_earned,
         SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN commission ELSE 0 END) as total_paid,
         SUM(CASE WHEN status = 'completed' AND payment_status = 'pending' THEN commission ELSE 0 END) as pending_payment
       FROM tasks 
       WHERE assigned_to = $1`,
      [partnerId]
    );

    const monthlyData = await pool.query(
      `SELECT 
         DATE_TRUNC('month', completion_date) as month,
         COUNT(*) as tasks_completed,
         SUM(commission) as commission_earned
       FROM tasks 
       WHERE assigned_to = $1 AND status = 'completed'
       GROUP BY DATE_TRUNC('month', completion_date)
       ORDER BY month DESC
       LIMIT 12`,
      [partnerId]
    );

    res.json({
      summary: commissionData.rows[0],
      monthly_breakdown: monthlyData.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;