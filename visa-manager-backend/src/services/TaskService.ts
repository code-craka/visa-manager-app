/**
 * TaskService - Comprehensive service layer for task management
 * Version: 0.3.2
 * 
 * Following the established patterns from ClientService with comprehensive
 * CRUD operations, validation, and Row-Level Security enforcement
 */

import pool from '../db';
import {
  Task,
  TaskWithDetails,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  TaskFilters,
  TaskStatistics,
  TaskPaginationOptions,
  TaskQueryResponse,
  TaskPriority,
  TaskStatus,
  TaskType,
  PaymentStatus
} from '../models/Task';
import {
  TaskValidation,
  TaskValidationError
} from '../models/TaskValidation';
import { webSocketService } from './WebSocketService';

/**
 * Custom error class for task operations
 */
export class TaskError extends Error {
  public statusCode: number;
  public code: string;
  public field?: string | undefined;

  constructor(message: string, statusCode: number = 500, code: string = 'TASK_ERROR', field?: string) {
    super(message);
    this.name = 'TaskError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

/**
 * TaskService class providing comprehensive task management operations
 */
export class TaskService {
  
  /**
   * Create a new task
   * @param taskData - Task creation data
   * @param userId - Clerk user ID of the user creating the task
   * @returns Promise<Task> - Created task
   */
  async createTask(taskData: CreateTaskRequest, userId: string): Promise<Task> {
    try {
      // Validate input data
      TaskValidation.validateCreateTask(taskData);

      // Verify client exists and user has access
      await this.verifyClientAccess(taskData.client_id, userId);

      // Verify assigned user exists if provided
      if (taskData.assigned_to) {
        await this.verifyUserExists(taskData.assigned_to, 'partner');
      }

      // Set current user context for RLS
      await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);

      const query = `
        INSERT INTO tasks (
          title, description, client_id, assigned_to, created_by,
          priority, task_type, commission_amount, commission_percentage,
          due_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        taskData.title.trim(),
        taskData.description?.trim() || null,
        taskData.client_id,
        taskData.assigned_to || null,
        userId,
        taskData.priority || 'medium',
        taskData.task_type,
        taskData.commission_amount || 0,
        taskData.commission_percentage || 0,
        taskData.due_date ? new Date(taskData.due_date) : null,
        taskData.notes?.trim() || null
      ];

      const result = await pool.query(query, values);
      const task = this.mapRowToTask(result.rows[0]);

      // TODO: Emit WebSocket event for real-time updates when methods are implemented
      // webSocketService.emitTaskCreated(task);

      return task;
    } catch (error) {
      if (error instanceof TaskValidationError) {
        throw new TaskError(error.message, 400, error.code, error.field);
      }
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Get task by ID with details
   * @param taskId - Task ID
   * @param userId - Clerk user ID
   * @returns Promise<TaskWithDetails | null> - Task with details or null if not found
   */
  async getTaskById(taskId: number, userId: string): Promise<TaskWithDetails | null> {
    try {
      // Set current user context for RLS
      await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);

      const query = `
        SELECT 
          t.*,
          c.name as client_name,
          c.email as client_email,
          c.visa_type as client_visa_type,
          c.status as client_status
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.id = $1
      `;

      const result = await pool.query(query, [taskId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToTaskWithDetails(result.rows[0]);
    } catch (error) {
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Update task
   * @param taskId - Task ID
   * @param updateData - Task update data
   * @param userId - Clerk user ID
   * @returns Promise<Task> - Updated task
   */
  async updateTask(taskId: number, updateData: UpdateTaskRequest, userId: string): Promise<Task> {
    try {
      // Validate input data
      TaskValidation.validateUpdateTask(updateData);

      // Set current user context for RLS
      await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramCount}`);
        values.push(updateData.title.trim());
        paramCount++;
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        values.push(updateData.description?.trim() || null);
        paramCount++;
      }

      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCount}`);
        values.push(updateData.status);
        paramCount++;
      }

      if (updateData.priority !== undefined) {
        updateFields.push(`priority = $${paramCount}`);
        values.push(updateData.priority);
        paramCount++;
      }

      if (updateData.notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        values.push(updateData.notes?.trim() || null);
        paramCount++;
      }

      if (updateFields.length === 0) {
        throw new TaskError('No fields to update', 400, 'NO_UPDATE_FIELDS');
      }

      // Add updated_at field
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      values.push(taskId);

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new TaskError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
      }

      const updatedTask = this.mapRowToTask(result.rows[0]);

      // TODO: Emit WebSocket event for real-time updates when methods are implemented
      // webSocketService.emitTaskUpdated(updatedTask);

      return updatedTask;
    } catch (error) {
      if (error instanceof TaskValidationError) {
        throw new TaskError(error.message, 400, error.code, error.field);
      }
      if (error instanceof TaskError) {
        throw error;
      }
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Delete task
   * @param taskId - Task ID
   * @param userId - Clerk user ID
   * @returns Promise<boolean> - True if deleted successfully
   */
  async deleteTask(taskId: number, userId: string): Promise<boolean> {
    try {
      // Set current user context for RLS
      await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);

      const result = await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

      if (result.rowCount === 0) {
        return false;
      }

      // TODO: Emit WebSocket event for real-time updates when methods are implemented
      // webSocketService.emitTaskDeleted(taskId);

      return true;
    } catch (error) {
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Assign task to partner
   * @param taskId - Task ID
   * @param assignData - Assignment data
   * @param userId - Clerk user ID
   * @returns Promise<Task> - Updated task
   */
  async assignTask(taskId: number, assignData: AssignTaskRequest, userId: string): Promise<Task> {
    try {
      // Validate input data
      TaskValidation.validateAssignTask(assignData);

      // Verify assigned user exists and is a partner
      await this.verifyUserExists(assignData.assigned_to, 'partner');

      const updateData: UpdateTaskRequest = {
        assigned_to: assignData.assigned_to,
        status: 'assigned' as TaskStatus
      };
      
      if (assignData.notes) {
        updateData.notes = assignData.notes;
      }

      return this.updateTask(taskId, updateData, userId);
    } catch (error) {
      if (error instanceof TaskValidationError) {
        throw new TaskError(error.message, 400, error.code, error.field);
      }
      throw error;
    }
  }

  /**
   * Helper method to verify client access
   */
  private async verifyClientAccess(clientId: number, userId: string): Promise<void> {
    const result = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND agency_id = $2',
      [clientId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new TaskError('Client not found or access denied', 404, 'CLIENT_NOT_FOUND');
    }
  }

  /**
   * Helper method to verify user exists
   */
  private async verifyUserExists(userId: string, role?: string): Promise<void> {
    let query = 'SELECT id FROM users WHERE clerk_user_id = $1';
    const params = [userId];
    
    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      throw new TaskError(`User not found${role ? ` with role ${role}` : ''}`, 404, 'USER_NOT_FOUND');
    }
  }

  /**
   * Helper method to map database row to Task
   */
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      client_id: row.client_id,
      assigned_to: row.assigned_to,
      created_by: row.created_by,
      priority: row.priority,
      status: row.status,
      task_type: row.task_type,
      commission_amount: parseFloat(row.commission_amount) || 0,
      commission_percentage: parseFloat(row.commission_percentage) || 0,
      payment_status: row.payment_status,
      due_date: row.due_date,
      assigned_date: row.assigned_date,
      completed_date: row.completed_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Helper method to map database row to TaskWithDetails
   */
  private mapRowToTaskWithDetails(row: any): TaskWithDetails {
    const task = this.mapRowToTask(row);
    
    return {
      ...task,
      client: {
        id: row.client_id,
        name: row.client_name,
        email: row.client_email,
        visa_type: row.client_visa_type,
        status: row.client_status
      },
      assigned_user: row.assigned_user_name ? {
        clerk_user_id: row.assigned_to,
        name: row.assigned_user_name,
        email: row.assigned_user_email,
        role: row.assigned_user_role
      } : undefined,
      created_user: {
        clerk_user_id: row.created_by,
        name: row.created_user_name,
        email: row.created_user_email,
        role: row.created_user_role
      }
    };
  }

  /**
   * Helper method to handle database errors
   */
  private handleDatabaseError(error: any): never {
    console.error('Database error in TaskService:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      throw new TaskError('Referenced record does not exist', 400, 'INVALID_REFERENCE');
    }
    
    if (error.code === '23505') { // Unique constraint violation
      throw new TaskError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
    }
    
    throw new TaskError('Database operation failed', 500, 'DATABASE_ERROR');
  }
}

// Export singleton instance
export const taskService = new TaskService();