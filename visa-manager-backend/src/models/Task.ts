import pool from '../db.js';

export interface Task {
  id: number;
  client_id: number;
  assigned_to: number | null;
  created_by: number;
  task_type: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  commission: number;
  payment_status: 'unpaid' | 'paid' | 'partial';
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Create a new task
export const createTask = async (
  clientId: number,
  assignedTo: number | null,
  createdBy: number,
  taskType: string,
  description: string | null,
  commission: number,
  dueDate?: Date | null
): Promise<Task> => {
  try {
    const result = await pool.query(
      `INSERT INTO tasks (client_id, assigned_to, created_by, task_type, description, commission, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [clientId, assignedTo, createdBy, taskType, description, commission, dueDate]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
};

// Get all tasks with filtering and pagination
export const getAllTasks = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    assignedTo?: number;
    createdBy?: number;
    status?: string;
    clientId?: number;
  }
): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> => {
  try {
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, c.name as client_name, c.passport as client_passport,
             creator.name as creator_name, assignee.name as assignee_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
    `;

    let countQuery = 'SELECT COUNT(*) FROM tasks t';
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters) {
      if (filters.assignedTo) {
        whereConditions.push(`t.assigned_to = $${params.length + 1}`);
        params.push(filters.assignedTo);
      }
      if (filters.createdBy) {
        whereConditions.push(`t.created_by = $${params.length + 1}`);
        params.push(filters.createdBy);
      }
      if (filters.status) {
        whereConditions.push(`t.status = $${params.length + 1}`);
        params.push(filters.status);
      }
      if (filters.clientId) {
        whereConditions.push(`t.client_id = $${params.length + 1}`);
        params.push(filters.clientId);
      }
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [tasksResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      tasks: tasksResult.rows,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
};

// Get task by ID
export const getTaskById = async (id: number): Promise<Task | null> => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as client_name, c.passport as client_passport,
              creator.name as creator_name, assignee.name as assignee_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    throw new Error('Failed to fetch task');
  }
};

// Update task status
export const updateTaskStatus = async (
  id: number,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  userId: number
): Promise<Task> => {
  try {
    const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';

    const result = await pool.query(
      `UPDATE tasks 
       SET status = $2, completed_at = ${completedAt}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND (assigned_to = $3 OR created_by = $3)
       RETURNING *`,
      [id, status, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
};

// Update task assignment
export const assignTask = async (
  id: number,
  assignedTo: number | null,
  assignedBy: number
): Promise<Task> => {
  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET assigned_to = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND created_by = $3
       RETURNING *`,
      [id, assignedTo, assignedBy]
    );

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error assigning task:', error);
    throw new Error('Failed to assign task');
  }
};

// Update payment status
export const updatePaymentStatus = async (
  id: number,
  paymentStatus: 'unpaid' | 'paid' | 'partial',
  updatedBy: number
): Promise<Task> => {
  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET payment_status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND created_by = $3
       RETURNING *`,
      [id, paymentStatus, updatedBy]
    );

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

// Get commission summary for a user
export const getCommissionSummary = async (userId: number, role: 'agency' | 'partner') => {
  try {
    let query;
    if (role === 'partner') {
      // For partners - tasks assigned to them
      query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed'), 0) as total_earned,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed' AND payment_status = 'paid'), 0) as paid_amount,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed' AND payment_status = 'unpaid'), 0) as unpaid_amount
        FROM tasks 
        WHERE assigned_to = $1
      `;
    } else {
      // For agencies - tasks created by them
      query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed'), 0) as total_commission_paid,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed' AND payment_status = 'paid'), 0) as paid_amount,
          COALESCE(SUM(commission) FILTER (WHERE status = 'completed' AND payment_status = 'unpaid'), 0) as outstanding_amount
        FROM tasks 
        WHERE created_by = $1
      `;
    }

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    throw new Error('Failed to fetch commission summary');
  }
};

// Delete task
export const deleteTask = async (id: number, userId: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND created_by = $2',
      [id, userId]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

// Get overdue tasks
export const getOverdueTasks = async (): Promise<Task[]> => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as client_name, assignee.name as assignee_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.due_date < CURRENT_DATE 
       AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY t.due_date ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    throw new Error('Failed to fetch overdue tasks');
  }
};
