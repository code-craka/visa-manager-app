// Partner Client Service - Restricted client access for partners
// Implements partner-specific client information display with data masking
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import pool from '../db';
import {
  Client,
  ClientRow,
  mapRowToClient,
  VisaType,
  ClientStatus
} from '../models/Client';
import {
  ClientError,
  CLIENT_ERRORS,
  handleDatabaseError
} from './ClientError';
import { AuditLogService, PartnerAccessLog } from './AuditLogService';

// Restricted client interface for partners - only task-relevant information
export interface RestrictedClient {
  id: number;
  name: string;
  email: string; // Masked for partners
  phone?: string; // Masked for partners
  visaType: VisaType;
  status: ClientStatus;
  notes?: string; // Filtered for partners
  createdAt: Date;
  updatedAt: Date;
  // Sensitive fields excluded: agencyId, createdBy, updatedBy
}

// Partner access context for audit logging
export interface PartnerAccessContext {
  partnerId: string;
  taskId?: number;
  accessType: 'view' | 'list';
  clientId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export class PartnerClientService {
  private auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  /**
   * Get clients accessible to a partner through their assigned tasks
   * @param partnerId - Partner's Clerk user ID
   * @param accessContext - Context for audit logging
   * @returns Promise<RestrictedClient[]> - Array of restricted client data
   */
  async getPartnerAccessibleClients(
    partnerId: string,
    accessContext: PartnerAccessContext
  ): Promise<RestrictedClient[]> {
    try {
      // Log the access attempt
      await this.auditLogService.logPartnerAccess({
        ...accessContext,
        partnerId,
        accessType: 'list',
        timestamp: new Date(),
        success: true
      });

      // Query clients that the partner has access to through tasks
      const result = await pool.query(`
        SELECT DISTINCT c.*
        FROM clients c
        INNER JOIN tasks t ON c.id = t.client_id
        INNER JOIN users u ON t.assigned_to = u.id
        WHERE u.clerk_user_id = $1
        AND t.status NOT IN ('cancelled')
        ORDER BY c.updated_at DESC
      `, [partnerId]);

      return result.rows.map(row => this.maskClientDataForPartner(mapRowToClient(row)));
    } catch (error: any) {
      // Log failed access attempt
      await this.auditLogService.logPartnerAccess({
        ...accessContext,
        partnerId,
        accessType: 'list',
        timestamp: new Date(),
        success: false,
        errorMessage: error.message
      });

      handleDatabaseError(error, 'retrieve partner clients');
    }
  }

  /**
   * Get specific client by ID with partner access validation
   * @param clientId - Client ID
   * @param partnerId - Partner's Clerk user ID
   * @param taskId - Optional task ID for context
   * @param accessContext - Context for audit logging
   * @returns Promise<RestrictedClient> - Restricted client data
   */
  async getPartnerAccessibleClientById(
    clientId: number,
    partnerId: string,
    taskId?: number,
    accessContext?: PartnerAccessContext
  ): Promise<RestrictedClient> {
    try {
      // Verify partner has access to this client through tasks
      const accessQuery = `
        SELECT c.*, t.id as task_id
        FROM clients c
        INNER JOIN tasks t ON c.id = t.client_id
        INNER JOIN users u ON t.assigned_to = u.id
        WHERE c.id = $1 
        AND u.clerk_user_id = $2
        AND t.status NOT IN ('cancelled')
        ${taskId ? 'AND t.id = $3' : ''}
      `;

      const params = taskId ? [clientId, partnerId, taskId] : [clientId, partnerId];
      const result = await pool.query(accessQuery, params);

      if (result.rows.length === 0) {
        // Log unauthorized access attempt
        const unauthorizedLog: PartnerAccessLog = {
          partnerId,
          clientId,
          accessType: 'view',
          timestamp: new Date(),
          success: false,
          errorMessage: 'Unauthorized access attempt'
        };

        if (taskId !== undefined) {
          unauthorizedLog.taskId = taskId;
        }

        if (accessContext?.ipAddress) {
          unauthorizedLog.ipAddress = accessContext.ipAddress;
        }

        if (accessContext?.userAgent) {
          unauthorizedLog.userAgent = accessContext.userAgent;
        }

        await this.auditLogService.logPartnerAccess(unauthorizedLog);

        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.UNAUTHORIZED.status,
          CLIENT_ERRORS.UNAUTHORIZED.code
        );
      }

      const client = mapRowToClient(result.rows[0]);
      const restrictedClient = this.maskClientDataForPartner(client);

      // Log successful access
      const successLog: PartnerAccessLog = {
        partnerId,
        clientId,
        taskId: taskId || result.rows[0].task_id,
        accessType: 'view',
        timestamp: new Date(),
        success: true
      };

      if (accessContext?.ipAddress) {
        successLog.ipAddress = accessContext.ipAddress;
      }

      if (accessContext?.userAgent) {
        successLog.userAgent = accessContext.userAgent;
      }

      await this.auditLogService.logPartnerAccess(successLog);

      return restrictedClient;
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }

      // Log failed access attempt
      const failedLog: PartnerAccessLog = {
        partnerId,
        clientId,
        accessType: 'view',
        timestamp: new Date(),
        success: false,
        errorMessage: error.message
      };

      if (taskId !== undefined) {
        failedLog.taskId = taskId;
      }

      if (accessContext?.ipAddress) {
        failedLog.ipAddress = accessContext.ipAddress;
      }

      if (accessContext?.userAgent) {
        failedLog.userAgent = accessContext.userAgent;
      }

      await this.auditLogService.logPartnerAccess(failedLog);

      handleDatabaseError(error, 'retrieve partner client');
    }
  }

  /**
   * Check if partner has access to a specific client
   * @param clientId - Client ID
   * @param partnerId - Partner's Clerk user ID
   * @returns Promise<boolean> - Whether partner has access
   */
  async hasPartnerAccess(clientId: number, partnerId: string): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT 1
        FROM clients c
        INNER JOIN tasks t ON c.id = t.client_id
        INNER JOIN users u ON t.assigned_to = u.id
        WHERE c.id = $1 
        AND u.clerk_user_id = $2
        AND t.status NOT IN ('cancelled')
        LIMIT 1
      `, [clientId, partnerId]);

      return result.rows.length > 0;
    } catch (error: any) {
      console.error('Error checking partner access:', error);
      return false;
    }
  }

  /**
   * Get client information for task context (minimal data)
   * @param clientId - Client ID
   * @param partnerId - Partner's Clerk user ID
   * @param taskId - Task ID for context
   * @returns Promise<Partial<RestrictedClient>> - Minimal client data for task context
   */
  async getClientForTaskContext(
    clientId: number,
    partnerId: string,
    taskId: number
  ): Promise<Partial<RestrictedClient>> {
    try {
      const result = await pool.query(`
        SELECT c.id, c.name, c.visa_type, c.status
        FROM clients c
        INNER JOIN tasks t ON c.id = t.client_id
        INNER JOIN users u ON t.assigned_to = u.id
        WHERE c.id = $1 
        AND u.clerk_user_id = $2
        AND t.id = $3
        AND t.status NOT IN ('cancelled')
      `, [clientId, partnerId, taskId]);

      if (result.rows.length === 0) {
        throw new ClientError(
          'Client not found or access denied',
          CLIENT_ERRORS.UNAUTHORIZED.status,
          CLIENT_ERRORS.UNAUTHORIZED.code
        );
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        visaType: row.visa_type as VisaType,
        status: row.status as ClientStatus
      };
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }
      handleDatabaseError(error, 'retrieve client for task context');
    }
  }

  /**
   * Mask sensitive client data for partner access
   * @param client - Full client data
   * @returns RestrictedClient - Masked client data
   */
  private maskClientDataForPartner(client: Client): RestrictedClient {
    const restrictedClient: RestrictedClient = {
      id: client.id,
      name: client.name,
      email: this.maskEmail(client.email),
      visaType: client.visaType,
      status: client.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };

    if (client.phone) {
      restrictedClient.phone = this.maskPhone(client.phone);
    }

    const filteredNotes = this.filterNotesForPartner(client.notes);
    if (filteredNotes) {
      restrictedClient.notes = filteredNotes;
    }

    return restrictedClient;
  }

  /**
   * Mask email address for partner view
   * @param email - Original email
   * @returns string - Masked email
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return email; // Return original if malformed
    }
    if (localPart.length <= 1) {
      return `${localPart[0]}***@${domain}`;
    } else if (localPart.length === 2) {
      return `${localPart}***@${domain}`;
    }
    return `${localPart.substring(0, 2)}***@${domain}`;
  }

  /**
   * Mask phone number for partner view
   * @param phone - Original phone number
   * @returns string - Masked phone number
   */
  private maskPhone(phone: string): string {
    // Keep only the last 4 digits visible
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) {
      return '***' + digits;
    }
    return '***-***-' + digits.slice(-4);
  }

  /**
   * Filter notes content for partner view (remove sensitive information)
   * @param notes - Original notes
   * @returns string | undefined - Filtered notes
   */
  private filterNotesForPartner(notes?: string): string | undefined {
    if (!notes) return undefined;

    // Remove potentially sensitive information patterns
    let filteredNotes = notes
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
      // Remove potential passport numbers (alphanumeric 6-12 chars)
      .replace(/\b[A-Z0-9]{6,12}\b/g, '[ID_REDACTED]')
      // Remove potential addresses (lines with numbers and street indicators)
      .replace(/\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[ADDRESS_REDACTED]');

    // Limit length for partner view
    if (filteredNotes.length > 200) {
      filteredNotes = filteredNotes.substring(0, 200) + '... [TRUNCATED]';
    }

    return filteredNotes;
  }
}