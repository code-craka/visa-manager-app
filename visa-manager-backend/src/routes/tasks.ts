import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Create a new task
router.post('/', async (req, res) => {
  const { client_id, assigned_to, status, commission, payment_status } = req.body;
  try {
    const newTask = await pool.query(
      'INSERT INTO tasks (client_id, assigned_to, status, commission, payment_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [client_id, assigned_to, status, commission, payment_status || 'pending']
    );
    res.json(newTask.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const allTasks = await pool.query('SELECT * FROM tasks');
    res.json(allTasks.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single task
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.json(task.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { client_id, assigned_to, status, commission, payment_status } = req.body;
  try {
    const updatedTask = await pool.query(
      'UPDATE tasks SET client_id = $1, assigned_to = $2, status = $3, commission = $4, payment_status = $5 WHERE id = $6 RETURNING *',
      [client_id, assigned_to, status, commission, payment_status, id]
    );
    res.json(updatedTask.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;