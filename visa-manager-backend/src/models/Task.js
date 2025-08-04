"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverdueTasks = exports.deleteTask = exports.getCommissionSummary = exports.updatePaymentStatus = exports.assignTask = exports.updateTaskStatus = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const db_js_1 = __importDefault(require("../db.js"));
// Create a new task
const createTask = async (clientId, assignedTo, createdBy, taskType, description, commission, dueDate) => {
    try {
        const result = await db_js_1.default.query(`INSERT INTO tasks (client_id, assigned_to, created_by, task_type, description, commission, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`, [clientId, assignedTo, createdBy, taskType, description, commission, dueDate]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
    }
};
exports.createTask = createTask;
// Get all tasks with filtering and pagination
const getAllTasks = async (page = 1, limit = 20, filters) => {
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
        let whereConditions = [];
        let params = [];
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
            db_js_1.default.query(query, [...params, limit, offset]),
            db_js_1.default.query(countQuery, params)
        ]);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        return {
            tasks: tasksResult.rows,
            total,
            page,
            totalPages
        };
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        throw new Error('Failed to fetch tasks');
    }
};
exports.getAllTasks = getAllTasks;
// Get task by ID
const getTaskById = async (id) => {
    try {
        const result = await db_js_1.default.query(`SELECT t.*, c.name as client_name, c.passport as client_passport,
              creator.name as creator_name, assignee.name as assignee_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = $1`, [id]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching task by ID:', error);
        throw new Error('Failed to fetch task');
    }
};
exports.getTaskById = getTaskById;
// Update task status
const updateTaskStatus = async (id, status, userId) => {
    try {
        const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
        const result = await db_js_1.default.query(`UPDATE tasks 
       SET status = $2, completed_at = ${completedAt}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND (assigned_to = $3 OR created_by = $3)
       RETURNING *`, [id, status, userId]);
        if (result.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error updating task status:', error);
        throw new Error('Failed to update task status');
    }
};
exports.updateTaskStatus = updateTaskStatus;
// Update task assignment
const assignTask = async (id, assignedTo, assignedBy) => {
    try {
        const result = await db_js_1.default.query(`UPDATE tasks 
       SET assigned_to = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND created_by = $3
       RETURNING *`, [id, assignedTo, assignedBy]);
        if (result.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error assigning task:', error);
        throw new Error('Failed to assign task');
    }
};
exports.assignTask = assignTask;
// Update payment status
const updatePaymentStatus = async (id, paymentStatus, updatedBy) => {
    try {
        const result = await db_js_1.default.query(`UPDATE tasks 
       SET payment_status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND created_by = $3
       RETURNING *`, [id, paymentStatus, updatedBy]);
        if (result.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
// Get commission summary for a user
const getCommissionSummary = async (userId, role) => {
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
        }
        else {
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
        const result = await db_js_1.default.query(query, [userId]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error fetching commission summary:', error);
        throw new Error('Failed to fetch commission summary');
    }
};
exports.getCommissionSummary = getCommissionSummary;
// Delete task
const deleteTask = async (id, userId) => {
    try {
        const result = await db_js_1.default.query('DELETE FROM tasks WHERE id = $1 AND created_by = $2', [id, userId]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
    }
};
exports.deleteTask = deleteTask;
// Get overdue tasks
const getOverdueTasks = async () => {
    try {
        const result = await db_js_1.default.query(`SELECT t.*, c.name as client_name, assignee.name as assignee_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.due_date < CURRENT_DATE 
       AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY t.due_date ASC`);
        return result.rows;
    }
    catch (error) {
        console.error('Error fetching overdue tasks:', error);
        throw new Error('Failed to fetch overdue tasks');
    }
};
exports.getOverdueTasks = getOverdueTasks;
//# sourceMappingURL=Task.js.map