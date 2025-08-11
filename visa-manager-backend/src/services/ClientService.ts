// ClientService - Comprehensive service layer for client management
// Following the established patterns from the copilot instructions

import pool from '../db';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  ClientRow,
  mapRowToClient,
  VisaType,
  ClientStatus,
  clientValidationSchema
} from '../models/Client';
import {
  ClientError,
  ClientValidationError,
  ValidationError,
  CLIENT_ERRORS,
  validateClientData,
  throwValidationError,
  handleDatabaseError
} from './ClientError';
import { webSocketService } from './WebSocketService';

export class ClientService {
  /**
   * Check if email is unique within the agency
   * @param email - Email to check
   * @param userId - Agency user ID (Clerk user ID)
   * @param excludeId - Optional client ID to exclude from check (for updates)
   * @returns Promise<boolean> - True if email is unique
   */
  async isEmailUnique(email: string, userId: string, excludeId?: number): Promise<boolean> {
    try {
      let query = 'SELECT COUNT(*) FROM clients WHERE LOWER(email) = LOWER($1) AND agency_id = $2';
      const params: any[] = [email, userId];

      if (excludeId) {
        query += ' AND id != $3';
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      const count = parseInt(result.rows[0].count);

      return count === 0;
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      throw new ClientError(
        'Failed to validate email uniqueness',
        CLIENT_ERRORS.VALIDATION_FAILED.status,
        CLIENT_ERRORS.VALIDATION_FAILED.code
      );
    }
  }

  /**
   * Create a new client with comprehensive validation
   * @param clientData - Client creation data
   * @param userId - Agency user ID (Clerk user ID)
   * @returns Promise<Client> - Created client
   */
  async createClient(clientData: CreateClientRequest, userId: string): Promise<Client> {
    try {
      // Validate input data
      const validation = validateClientData(clientData, false);
      if (!validation.isValid) {
        throwValidationError(validation.errors);
      }

      const validatedData = validation.validatedData;

      // Insert into database
      const result = await pool.query(
        `INSERT INTO clients (name, email, phone, visa_type, status, notes, agency_id, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          validatedData.name,
          validatedData.email,
          validatedData.phone,
          validatedData.visaType,
          validatedData.status || ClientStatus.PENDING,
          validatedData.notes,
          userId,
          userId,
          userId
        ]
      );

      const newClient = mapRowToClient(result.rows[0]);

      // Emit WebSocket notification for client creation
      try {
        webSocketService.notifyClientCreated(newClient);

        // Also update client statistics
        const stats = await this.getClientStats(userId);
        webSocketService.notifyClientStats(stats, userId);
      } catch (wsError) {
        console.error('WebSocket notification error (create):', wsError);
        // Don't fail the operation if WebSocket fails
      }

      return newClient;
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }
      handleDatabaseError(error, 'create');
    }
  }

  /**
   * Get all clients with filtering, searching, sorting, and pagination
   * @param userId - Agency user ID (Clerk user ID)
   * @param filters - Optional filtering and pagination options
   * @returns Promise<Client[]> - Array of clients
   */
  async getClients(userId: string, filters?: ClientFilters): Promise<Client[]> {
    try {
      const {
        search,
        status,
        visaType,
        sortBy = 'date',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters || {};

      const offset = (page - 1) * limit;
      let whereConditions = ['agency_id = $1'];
      let params: any[] = [userId];
      let paramIndex = 2;

      // Add search filter (name and email)
      if (search) {
        whereConditions.push(`(
          name ILIKE $${paramIndex} OR
          email ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Add status filter
      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      // Add visa type filter
      if (visaType) {
        whereConditions.push(`visa_type = $${paramIndex}`);
        params.push(visaType);
        paramIndex++;
      }

      // Build query with sorting
      const sortColumn = sortBy === 'date' ? 'created_at' :
        sortBy === 'visaType' ? 'visa_type' : sortBy;
      const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

      const query = `
        SELECT * FROM clients
        WHERE ${whereConditions.join(' AND ')}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const result = await pool.query(query, [...params, limit, offset]);
      return result.rows.map(mapRowToClient);
    } catch (error: any) {
      handleDatabaseError(error, 'retrieve');
    }
  }

  /**
   * Get client count for pagination
   * @param userId - Agency user ID
   * @param filters - Optional filtering options
   * @returns Promise<number> - Total count of clients
   */
  async getClientCount(userId: string, filters?: ClientFilters): Promise<number> {
    try {
      const { search, status, visaType } = filters || {};

      let whereConditions = ['agency_id = $1'];
      let params: any[] = [userId];
      let paramIndex = 2;

      if (search) {
        whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (visaType) {
        whereConditions.push(`visa_type = $${paramIndex}`);
        params.push(visaType);
        paramIndex++;
      }

      const query = `SELECT COUNT(*) FROM clients WHERE ${whereConditions.join(' AND ')}`;
      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      handleDatabaseError(error, 'retrieve');
    }
  }

  /**
   * Get client by ID with RLS enforcement
   * @param id - Client ID
   * @param userId - Agency user ID (Clerk user ID)
   * @returns Promise<Client> - Client data
   */
  async getClientById(id: number, userId: string): Promise<Client> {
    try {
      const result = await pool.query(
        'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.NOT_FOUND.status,
          CLIENT_ERRORS.NOT_FOUND.code
        );
      }

      return mapRowToClient(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }
      handleDatabaseError(error, 'retrieve');
    }
  }

  /**
   * Update client with validation and RLS enforcement
   * @param id - Client ID
   * @param updates - Partial client update data
   * @param userId - Agency user ID (Clerk user ID)
   * @returns Promise<Client> - Updated client data
   */
  async updateClient(id: number, updates: UpdateClientRequest, userId: string): Promise<Client> {
    try {
      // Validate update data
      const validation = validateClientData(updates, true);
      if (!validation.isValid) {
        throwValidationError(validation.errors);
      }

      const validatedData = validation.validatedData;

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any[] = [id, userId];
      let paramIndex = 3;

      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbColumn = key === 'visaType' ? 'visa_type' : key;
          updateFields.push(`${dbColumn} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new ClientError(
          'No fields to update',
          CLIENT_ERRORS.VALIDATION_FAILED.status,
          CLIENT_ERRORS.VALIDATION_FAILED.code
        );
      }

      // Add updated_by and updated_at fields
      updateFields.push(`updated_by = $${paramIndex}`, `updated_at = NOW()`);
      params.push(userId);

      const query = `
        UPDATE clients
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND agency_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.NOT_FOUND.status,
          CLIENT_ERRORS.NOT_FOUND.code
        );
      }

      const updatedClient = mapRowToClient(result.rows[0]);

      // Emit WebSocket notification for client update
      try {
        webSocketService.notifyClientUpdated(updatedClient, validatedData);

        // Also update client statistics if status changed
        if (validatedData.status) {
          const stats = await this.getClientStats(userId);
          webSocketService.notifyClientStats(stats, userId);
        }
      } catch (wsError) {
        console.error('WebSocket notification error (update):', wsError);
        // Don't fail the operation if WebSocket fails
      }

      return updatedClient;
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }
      handleDatabaseError(error, 'update');
    }
  }

  /**
   * Delete client with active task validation
   * @param id - Client ID
   * @param userId - Agency user ID (Clerk user ID)
   * @returns Promise<void>
   */
  async deleteClient(id: number, userId: string): Promise<void> {
    try {
      // First get the client data for WebSocket notification
      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
        [id, userId]
      );

      if (clientResult.rows.length === 0) {
        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.NOT_FOUND.status,
          CLIENT_ERRORS.NOT_FOUND.code
        );
      }

      const clientToDelete = mapRowToClient(clientResult.rows[0]);

      // Check if client has active tasks
      const taskCheck = await pool.query(
        `SELECT COUNT(*) as task_count FROM tasks
         WHERE client_id = $1 AND status NOT IN ('completed', 'cancelled')`,
        [id]
      );

      const activeTaskCount = parseInt(taskCheck.rows[0].task_count);
      if (activeTaskCount > 0) {
        throw new ClientError(
          'Cannot delete client with active tasks',
          CLIENT_ERRORS.HAS_ACTIVE_TASKS.status,
          CLIENT_ERRORS.HAS_ACTIVE_TASKS.code
        );
      }

      // Delete the client
      const result = await pool.query(
        'DELETE FROM clients WHERE id = $1 AND agency_id = $2',
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.NOT_FOUND.status,
          CLIENT_ERRORS.NOT_FOUND.code
        );
      }

      // Emit WebSocket notification for client deletion
      try {
        webSocketService.notifyClientDeleted(id, clientToDelete.name, userId);

        // Also update client statistics
        const stats = await this.getClientStats(userId);
        webSocketService.notifyClientStats(stats, userId);
      } catch (wsError) {
        console.error('WebSocket notification error (delete):', wsError);
        // Don't fail the operation if WebSocket fails
      }
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }
      handleDatabaseError(error, 'delete');
    }
  }

  /**
   * Get client statistics for dashboard
   * @param userId - Agency user ID (Clerk user ID)
   * @returns Promise<ClientStats> - Client statistics
   */
  async getClientStats(userId: string): Promise<ClientStats> {
    try {
      // Use optimized materialized view function
      const result = await pool.query(
        'SELECT * FROM get_client_stats($1)',
        [userId]
      );

      const stats = result.rows[0];

      return {
        totalClients: parseInt(stats.total_clients),
        pending: parseInt(stats.pending),
        completed: parseInt(stats.completed),
        inProgress: parseInt(stats.in_progress),
        underReview: parseInt(stats.under_review),
        approved: parseInt(stats.approved),
        rejected: parseInt(stats.rejected),
        documentsRequired: parseInt(stats.documents_required)
      };
    } catch (error: any) {
      console.error('Error fetching client statistics:', error);
      throw new ClientError(
        'Failed to retrieve client statistics',
        CLIENT_ERRORS.STATS_FAILED.status,
        CLIENT_ERRORS.STATS_FAILED.code
      );
    }
  }

  /**
   * Get clients for task assignment (simplified view)
   * @param userId - Agency user ID
   * @param excludeIds - Client IDs to exclude
   * @returns Promise<Client[]> - Array of clients available for task assignment
   */
  async getClientsForTaskAssignment(userId: string, excludeIds: number[] = []): Promise<Partial<Client>[]> {
    try {
      let query = `
        SELECT id, name, email, visa_type, status
        FROM clients
        WHERE agency_id = $1
      `;
      let params: any[] = [userId];

      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map((_, index) => `$${index + 2}`).join(',');
        query += ` AND id NOT IN (${placeholders})`;
        params.push(...excludeIds);
      }

      query += ' ORDER BY name ASC';

      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        visaType: row.visa_type as VisaType,
        status: row.status as ClientStatus
      }));
    } catch (error: any) {
      handleDatabaseError(error, 'retrieve');
    }
  }
}
