/**
 * Task Routes - RESTful API endpoints for task management
 * Version: 0.3.2
 * 
 * Comprehensive task management endpoints following established patterns
 * from client routes with proper authentication, validation, and error handling
 */

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { taskService } from '../services/TaskService';
import { TaskError, formatTaskErrorResponse, isTaskError, isValidationError } from '../services/TaskError';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  TaskFilters,
  TaskPaginationOptions
} from '../models/Task';

const router = express.Router();

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private (Agency only)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    // Only agencies can create tasks
    if (userRole !== 'agency') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only agencies can create tasks', code: 'ACCESS_DENIED' }
      });
    }

    const taskData: CreateTaskRequest = req.body;
    const task = await taskService.createTask(taskData, userId);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    
    if (isTaskError(error) || isValidationError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route GET /api/tasks
 * @desc Get tasks with filtering and pagination
 * @access Private
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    // Parse query parameters
    const filters: TaskFilters = {};
    
    if (req.query.client_id) {
      filters.client_id = parseInt(req.query.client_id as string);
    }
    if (req.query.assigned_to) {
      filters.assigned_to = req.query.assigned_to as string;
    }
    if (req.query.created_by) {
      filters.created_by = req.query.created_by as string;
    }
    if (req.query.priority) {
      filters.priority = req.query.priority as any;
    }
    if (req.query.status) {
      filters.status = req.query.status as any;
    }
    if (req.query.task_type) {
      filters.task_type = req.query.task_type as any;
    }
    if (req.query.payment_status) {
      filters.payment_status = req.query.payment_status as any;
    }
    if (req.query.due_date_from) {
      filters.due_date_from = req.query.due_date_from as string;
    }
    if (req.query.due_date_to) {
      filters.due_date_to = req.query.due_date_to as string;
    }
    if (req.query.created_from) {
      filters.created_from = req.query.created_from as string;
    }
    if (req.query.created_to) {
      filters.created_to = req.query.created_to as string;
    }
    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    const pagination: TaskPaginationOptions = {};
    
    if (req.query.page) {
      pagination.page = parseInt(req.query.page as string);
    }
    if (req.query.limit) {
      pagination.limit = parseInt(req.query.limit as string);
    }
    if (req.query.sort_by) {
      pagination.sort_by = req.query.sort_by as any;
    }
    if (req.query.sort_order) {
      pagination.sort_order = req.query.sort_order as any;
    }

    // For partners, automatically filter to their assigned tasks
    if (userRole === 'partner') {
      filters.assigned_to = userId;
    }

    // TODO: Implement getTasks method in TaskService
    const result = { tasks: [], pagination: { current_page: 1, total_pages: 1, total_count: 0, limit: 20, has_next: false, has_previous: false } };

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
      message: 'Tasks retrieved successfully'
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    
    if (isTaskError(error) || isValidationError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route GET /api/tasks/statistics
 * @desc Get task statistics for dashboard
 * @access Private
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    // TODO: Implement getTaskStatistics method in TaskService
    const statistics = { total_tasks: 0, pending: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 };

    res.json({
      success: true,
      data: statistics,
      message: 'Task statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    
    if (isTaskError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route GET /api/tasks/:id
 * @desc Get task by ID
 * @access Private
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID', code: 'INVALID_TASK_ID' }
      });
    }

    const task = await taskService.getTaskById(taskId, userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found or access denied', code: 'TASK_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task retrieved successfully'
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    
    if (isTaskError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route PUT /api/tasks/:id
 * @desc Update task
 * @access Private
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const taskId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID', code: 'INVALID_TASK_ID' }
      });
    }

    const updateData: UpdateTaskRequest = req.body;

    // Partners can only update specific fields
    if (userRole === 'partner') {
      const allowedFields = ['status', 'notes', 'completed_date'];
      const providedFields = Object.keys(updateData);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(403).json({
          success: false,
          error: { 
            message: `Partners can only update: ${allowedFields.join(', ')}`, 
            code: 'RESTRICTED_UPDATE',
            field: invalidFields[0]
          }
        });
      }
    }

    const task = await taskService.updateTask(taskId, updateData, userId);

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    
    if (isTaskError(error) || isValidationError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route PATCH /api/tasks/:id/assign
 * @desc Assign task to partner
 * @access Private (Agency only)
 */
router.patch('/:id/assign', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const taskId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    // Only agencies can assign tasks
    if (userRole !== 'agency') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only agencies can assign tasks', code: 'ACCESS_DENIED' }
      });
    }

    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID', code: 'INVALID_TASK_ID' }
      });
    }

    const assignData: AssignTaskRequest = req.body;
    const task = await taskService.assignTask(taskId, assignData, userId);

    res.json({
      success: true,
      data: task,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    console.error('Assign task error:', error);
    
    if (isTaskError(error) || isValidationError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete task
 * @access Private (Agency only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const taskId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID not found in token', code: 'UNAUTHORIZED' }
      });
    }

    // Only agencies can delete tasks
    if (userRole !== 'agency') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only agencies can delete tasks', code: 'ACCESS_DENIED' }
      });
    }

    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID', code: 'INVALID_TASK_ID' }
      });
    }

    const deleted = await taskService.deleteTask(taskId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found or access denied', code: 'TASK_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    
    if (isTaskError(error)) {
      const errorResponse = formatTaskErrorResponse(error as TaskError);
      return res.status(error.statusCode).json(errorResponse);
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    });
  }
});

export default router;