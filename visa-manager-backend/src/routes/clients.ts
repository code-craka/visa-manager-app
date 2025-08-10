// Client Management REST API Routes
// Following the established patterns from the copilot instructions

import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { ClientService } from '../services/ClientService';
import { PartnerClientService, RestrictedClient, PartnerAccessContext } from '../services/PartnerClientService';
import {
  ClientError,
  ClientValidationError
} from '../services/ClientError';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  VisaType,
  ClientStatus
} from '../models/Client';

// Extended Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    primaryEmail: string;
    role: 'agency' | 'admin' | 'partner';
    dbUserId?: number;
  };
}

// Standard API response interfaces
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

class ClientController {
  private clientService: ClientService;
  private partnerClientService: PartnerClientService;

  constructor() {
    this.clientService = new ClientService();
    this.partnerClientService = new PartnerClientService();
  }

  /**
   * Create a new client
   * POST /api/clients
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientData: CreateClientRequest = req.body;
      const userId = req.user!.id;

      const client = await this.clientService.createClient(clientData, userId);

      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully'
      } as ApiSuccessResponse<Client>);
    } catch (error: any) {
      if (error instanceof ClientValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode,
          details: error.validationErrors
        } as ApiErrorResponse);
      } else if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Unexpected error in client creation:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Get all clients with filtering, searching, sorting, and pagination
   * GET /api/clients
   */
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // If user is a partner, redirect to partner-specific endpoint
      if (userRole === 'partner') {
        return this.getPartnerAccessibleClients(req, res);
      }

      // Parse query parameters with proper typing
      const filters: ClientFilters = {
        search: req.query.search as string,
        status: req.query.status as ClientStatus,
        visaType: req.query.visaType as VisaType,
        sortBy: req.query.sortBy as 'name' | 'date' | 'visaType',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      // Validate pagination parameters
      if (filters.page && filters.page < 1) filters.page = 1;
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) filters.limit = 20;

      const [clients, totalCount] = await Promise.all([
        this.clientService.getClients(userId, filters),
        this.clientService.getClientCount(userId, filters)
      ]);

      const pagination: PaginationInfo = {
        page: filters.page!,
        limit: filters.limit!,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / filters.limit!)
      };

      res.json({
        success: true,
        data: clients,
        pagination
      } as ApiSuccessResponse<Client[]>);
    } catch (error: any) {
      console.error('Error retrieving clients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve clients',
        errorCode: 'RETRIEVAL_FAILED'
      } as ApiErrorResponse);
    }
  }

  /**
   * Get client by ID
   * GET /api/clients/:id
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.id!);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (isNaN(clientId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid client ID',
          errorCode: 'INVALID_ID'
        } as ApiErrorResponse);
        return;
      }

      // If user is a partner, use partner-specific access
      if (userRole === 'partner') {
        return this.getPartnerClientById(req, res);
      }

      const client = await this.clientService.getClientById(clientId, userId);

      res.json({
        success: true,
        data: client
      } as ApiSuccessResponse<Client>);
    } catch (error: any) {
      if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Unexpected error retrieving client:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Update client
   * PUT /api/clients/:id
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.id!);
      const userId = req.user!.id;
      const updates: UpdateClientRequest = req.body;

      if (isNaN(clientId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid client ID',
          errorCode: 'INVALID_ID'
        } as ApiErrorResponse);
        return;
      }

      const client = await this.clientService.updateClient(clientId, updates, userId);

      res.json({
        success: true,
        data: client,
        message: 'Client updated successfully'
      } as ApiSuccessResponse<Client>);
    } catch (error: any) {
      if (error instanceof ClientValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode,
          details: error.validationErrors
        } as ApiErrorResponse);
      } else if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Unexpected error updating client:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Delete client
   * DELETE /api/clients/:id
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.id!);
      const userId = req.user!.id;

      if (isNaN(clientId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid client ID',
          errorCode: 'INVALID_ID'
        } as ApiErrorResponse);
        return;
      }

      await this.clientService.deleteClient(clientId, userId);

      res.json({
        success: true,
        message: 'Client deleted successfully'
      } as ApiSuccessResponse);
    } catch (error: any) {
      if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Unexpected error deleting client:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Get client statistics for dashboard
   * GET /api/clients/stats
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await this.clientService.getClientStats(userId);

      res.json({
        success: true,
        data: stats
      } as ApiSuccessResponse);
    } catch (error: any) {
      console.error('Error retrieving client statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve client statistics',
        errorCode: 'STATS_FAILED'
      } as ApiErrorResponse);
    }
  }

  /**
   * Get clients for task assignment (simplified view)
   * GET /api/clients/for-assignment
   */
  async getForAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const excludeIds = req.query.exclude ?
        (req.query.exclude as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) :
        [];

      const clients = await this.clientService.getClientsForTaskAssignment(userId, excludeIds);

      res.json({
        success: true,
        data: clients
      } as ApiSuccessResponse);
    } catch (error: any) {
      console.error('Error retrieving clients for assignment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve clients for assignment',
        errorCode: 'RETRIEVAL_FAILED'
      } as ApiErrorResponse);
    }
  }

  /**
   * Get clients accessible to partner (restricted view)
   * GET /api/clients/partner-accessible
   */
  async getPartnerAccessibleClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const partnerId = req.user!.id;
      const accessContext: PartnerAccessContext = {
        partnerId,
        accessType: 'list' as const
      };
      
      if (req.ip) {
        accessContext.ipAddress = req.ip;
      }
      
      const userAgent = req.get('User-Agent');
      if (userAgent) {
        accessContext.userAgent = userAgent;
      }

      const clients = await this.partnerClientService.getPartnerAccessibleClients(partnerId, accessContext);

      res.json({
        success: true,
        data: clients
      } as ApiSuccessResponse<RestrictedClient[]>);
    } catch (error: any) {
      if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Error retrieving partner accessible clients:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve accessible clients',
          errorCode: 'RETRIEVAL_FAILED'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Get specific client by ID for partner (restricted view)
   * GET /api/clients/:id/partner-view
   */
  async getPartnerClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.id!);
      const partnerId = req.user!.id;
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;

      if (isNaN(clientId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid client ID',
          errorCode: 'INVALID_ID'
        } as ApiErrorResponse);
        return;
      }

      const accessContext: PartnerAccessContext = {
        partnerId,
        accessType: 'view' as const,
        clientId
      };
      
      if (taskId !== undefined) {
        accessContext.taskId = taskId;
      }
      
      if (req.ip) {
        accessContext.ipAddress = req.ip;
      }
      
      const userAgent = req.get('User-Agent');
      if (userAgent) {
        accessContext.userAgent = userAgent;
      }

      const client = await this.partnerClientService.getPartnerAccessibleClientById(
        clientId,
        partnerId,
        taskId,
        accessContext
      );

      res.json({
        success: true,
        data: client
      } as ApiSuccessResponse<RestrictedClient>);
    } catch (error: any) {
      if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Error retrieving partner client:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Get client for task context (minimal data for partners)
   * GET /api/clients/:id/task-context
   */
  async getClientForTaskContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = parseInt(req.params.id!);
      const partnerId = req.user!.id;
      const taskId = parseInt(req.query.taskId as string);

      if (isNaN(clientId) || isNaN(taskId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid client ID or task ID',
          errorCode: 'INVALID_ID'
        } as ApiErrorResponse);
        return;
      }

      const client = await this.partnerClientService.getClientForTaskContext(clientId, partnerId, taskId);

      res.json({
        success: true,
        data: client
      } as ApiSuccessResponse<Partial<RestrictedClient>>);
    } catch (error: any) {
      if (error instanceof ClientError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          errorCode: error.errorCode
        } as ApiErrorResponse);
      } else {
        console.error('Error retrieving client for task context:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          errorCode: 'INTERNAL_ERROR'
        } as ApiErrorResponse);
      }
    }
  }

  /**
   * Validate email uniqueness
   * GET /api/clients/validate-email
   */
  async validateEmailUniqueness(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined;
      const userId = req.user!.id;

      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Email parameter is required',
          errorCode: 'MISSING_EMAIL'
        } as ApiErrorResponse);
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.json({
          success: true,
          data: { isUnique: false, reason: 'Invalid email format' }
        } as ApiSuccessResponse<{ isUnique: boolean; reason?: string }>);
        return;
      }

      const isUnique = await this.clientService.isEmailUnique(email.toLowerCase(), userId, excludeId);

      res.json({
        success: true,
        data: { isUnique }
      } as ApiSuccessResponse<{ isUnique: boolean }>);
    } catch (error: any) {
      console.error('Error validating email uniqueness:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate email',
        errorCode: 'VALIDATION_FAILED'
      } as ApiErrorResponse);
    }
  }
}

// Initialize router and controller
const router = express.Router();
const clientController = new ClientController();

// Route definitions with proper middleware and role-based access control

// Stats endpoint (should come before /:id to avoid conflicts)
router.get('/stats',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getStats(req, res);
  }
);

// For assignment endpoint
router.get('/for-assignment',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getForAssignment(req, res);
  }
);

// Partner accessible clients endpoint
router.get('/partner-accessible',
  requireAuth,
  requireRole(['partner']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getPartnerAccessibleClients(req, res);
  }
);

// Email validation endpoint
router.get('/validate-email',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.validateEmailUniqueness(req, res);
  }
);

// Create new client (agency only)
router.post('/',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.create(req, res);
  }
);

// Get all clients (both agencies and partners can view, but with different access levels)
router.get('/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getAll(req, res);
  }
);

// Partner view of specific client
router.get('/:id/partner-view',
  requireAuth,
  requireRole(['partner']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getPartnerClientById(req, res);
  }
);

// Client for task context (minimal data for partners)
router.get('/:id/task-context',
  requireAuth,
  requireRole(['partner']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getClientForTaskContext(req, res);
  }
);

// Get specific client by ID
router.get('/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.getById(req, res);
  }
);

// Update client (agency only)
router.put('/:id',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.update(req, res);
  }
);

// Delete client (agency only)
router.delete('/:id',
  requireAuth,
  requireRole(['agency']),
  async (req: AuthenticatedRequest, res: Response) => {
    await clientController.delete(req, res);
  }
);

export default router;