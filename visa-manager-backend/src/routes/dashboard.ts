import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/agency', async (req, res) => {
  try {
    const totalClientsResult = await pool.query('SELECT COUNT(*) FROM clients');
    const pendingTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status != 'completed'`);
    const completedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status = 'completed'`);
    const totalCommissionResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE payment_status = 'paid'`);

    res.json({
      totalClients: parseInt(totalClientsResult.rows[0].count),
      pendingTasks: parseInt(pendingTasksResult.rows[0].count),
      completedTasks: parseInt(completedTasksResult.rows[0].count),
      totalCommission: parseFloat(totalCommissionResult.rows[0].sum || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/partner', async (req, res) => {
  // Assuming partner ID is passed in the request, e.g., from a JWT token
  const partnerId = req.query.partnerId || 1; // Dummy partnerId

  try {
    const newlyAssignedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = "pending"`, [partnerId]);
    const completedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = "completed"`, [partnerId]);
    const earnedCommissionsResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE assigned_to = $1 AND payment_status = "paid"`, [partnerId]);

    res.json({
      newlyAssignedTasks: parseInt(newlyAssignedTasksResult.rows[0].count),
      completedTasks: parseInt(completedTasksResult.rows[0].count),
      earnedCommissions: parseFloat(earnedCommissionsResult.rows[0].sum || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;