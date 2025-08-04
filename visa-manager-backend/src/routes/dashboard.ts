import { Router } from 'express';
import pool from '../db.js';
import { verifyNeonAuth } from '../middleware/auth.js';
import { getUserByNeonId } from '../models/User.js';

const router = Router();

// Agency dashboard
router.get('/agency', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Access denied: Agency role required' });
    }

    const totalClientsResult = await pool.query('SELECT COUNT(*) FROM clients');
    const pendingTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status != 'completed'`);
    const completedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status = 'completed'`);
    const totalCommissionResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE payment_status = 'paid'`);
    const pendingPaymentsResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE status = 'completed' AND payment_status = 'pending'`);

    // Recent tasks
    const recentTasksResult = await pool.query(`
      SELECT t.*, c.name as client_name, u.name as partner_name 
      FROM tasks t
      JOIN clients c ON t.client_id = c.id
      JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    // Partner performance
    const partnerPerformanceResult = await pool.query(`
      SELECT u.name, u.email,
             COUNT(t.id) as total_tasks,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
             SUM(CASE WHEN t.status = 'completed' THEN t.commission ELSE 0 END) as commission_earned
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.role = 'partner'
      GROUP BY u.id, u.name, u.email
      ORDER BY commission_earned DESC
    `);

    res.json({
      overview: {
        totalClients: parseInt(totalClientsResult.rows[0].count),
        pendingTasks: parseInt(pendingTasksResult.rows[0].count),
        completedTasks: parseInt(completedTasksResult.rows[0].count),
        totalCommissionPaid: parseFloat(totalCommissionResult.rows[0].sum || 0),
        pendingPayments: parseFloat(pendingPaymentsResult.rows[0].sum || 0)
      },
      recentTasks: recentTasksResult.rows,
      partnerPerformance: partnerPerformanceResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Partner dashboard
router.get('/partner', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user || user.role !== 'partner') {
      return res.status(403).json({ error: 'Access denied: Partner role required' });
    }

    const partnerId = user.id;

    const newlyAssignedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = 'pending'`, [partnerId]);
    const inProgressTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = 'in_progress'`, [partnerId]);
    const completedTasksResult = await pool.query(`SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status = 'completed'`, [partnerId]);
    const earnedCommissionsResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE assigned_to = $1 AND payment_status = 'paid'`, [partnerId]);
    const pendingCommissionsResult = await pool.query(`SELECT SUM(commission) FROM tasks WHERE assigned_to = $1 AND status = 'completed' AND payment_status = 'pending'`, [partnerId]);

    // Recent assigned tasks
    const recentTasksResult = await pool.query(`
      SELECT t.*, c.name as client_name, c.passport, c.visa_type 
      FROM tasks t
      JOIN clients c ON t.client_id = c.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [partnerId]);

    // Monthly performance
    const monthlyPerformanceResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', completion_date) as month,
        COUNT(*) as tasks_completed,
        SUM(commission) as commission_earned
      FROM tasks 
      WHERE assigned_to = $1 AND status = 'completed'
      GROUP BY DATE_TRUNC('month', completion_date)
      ORDER BY month DESC
      LIMIT 6
    `, [partnerId]);

    res.json({
      overview: {
        newlyAssignedTasks: parseInt(newlyAssignedTasksResult.rows[0].count),
        inProgressTasks: parseInt(inProgressTasksResult.rows[0].count),
        completedTasks: parseInt(completedTasksResult.rows[0].count),
        earnedCommissions: parseFloat(earnedCommissionsResult.rows[0].sum || 0),
        pendingCommissions: parseFloat(pendingCommissionsResult.rows[0].sum || 0)
      },
      recentTasks: recentTasksResult.rows,
      monthlyPerformance: monthlyPerformanceResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint for agencies
router.get('/analytics', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const user = await getUserByNeonId(currentUser.id);

    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Access denied: Agency role required' });
    }

    // Task status distribution
    const taskStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `);

    // Monthly task completion trends
    const monthlyTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as tasks_created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as tasks_completed
      FROM tasks
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Commission trends
    const commissionTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', completion_date) as month,
        SUM(commission) as total_commission,
        COUNT(*) as completed_tasks
      FROM tasks
      WHERE status = 'completed' AND completion_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', completion_date)
      ORDER BY month
    `);

    res.json({
      taskStatusDistribution: taskStatusResult.rows,
      monthlyTrends: monthlyTrendsResult.rows,
      commissionTrends: commissionTrendsResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;