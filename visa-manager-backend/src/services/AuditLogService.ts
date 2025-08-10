// Audit Log Service - Logging for partner access attempts and security events
// Requirements: 6.5 - Add audit logging for unauthorized access attempts

import pool from '../db';

export interface PartnerAccessLog {
  partnerId: string;
  clientId?: number;
  taskId?: number;
  accessType: 'view' | 'list';
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id?: number;
  userId: string;
  userRole: 'agency' | 'partner';
  action: string;
  resourceType: 'client' | 'task' | 'user';
  resourceId?: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AuditLogService {
  /**
   * Log partner access attempts to client data
   * @param accessLog - Partner access log entry
   */
  async logPartnerAccess(accessLog: PartnerAccessLog): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO audit_logs (
          user_id, user_role, action, resource_type, resource_id,
          success, error_message, ip_address, user_agent, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        accessLog.partnerId,
        'partner',
        `client_${accessLog.accessType}`,
        'client',
        accessLog.clientId,
        accessLog.success,
        accessLog.errorMessage,
        accessLog.ipAddress,
        accessLog.userAgent,
        JSON.stringify({
          taskId: accessLog.taskId,
          accessType: accessLog.accessType
        }),
        accessLog.timestamp
      ]);

      // If this is an unauthorized access attempt, also log to security events
      if (!accessLog.success && accessLog.errorMessage?.includes('Unauthorized')) {
        const securityEvent: AuditLogEntry = {
          userId: accessLog.partnerId,
          userRole: 'partner',
          action: 'unauthorized_client_access',
          resourceType: 'client',
          success: false,
          timestamp: accessLog.timestamp
        };

        if (accessLog.clientId !== undefined) {
          securityEvent.resourceId = accessLog.clientId;
        }

        if (accessLog.errorMessage) {
          securityEvent.errorMessage = accessLog.errorMessage;
        }

        if (accessLog.ipAddress) {
          securityEvent.ipAddress = accessLog.ipAddress;
        }

        if (accessLog.userAgent) {
          securityEvent.userAgent = accessLog.userAgent;
        }

        securityEvent.metadata = {
          severity: 'medium'
        };

        if (accessLog.taskId !== undefined) {
          securityEvent.metadata.taskId = accessLog.taskId;
        }

        await this.logSecurityEvent(securityEvent);
      }
    } catch (error) {
      console.error('Failed to log partner access:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log general audit events
   * @param auditEntry - Audit log entry
   */
  async logAuditEvent(auditEntry: AuditLogEntry): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO audit_logs (
          user_id, user_role, action, resource_type, resource_id,
          success, error_message, ip_address, user_agent, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        auditEntry.userId,
        auditEntry.userRole,
        auditEntry.action,
        auditEntry.resourceType,
        auditEntry.resourceId,
        auditEntry.success,
        auditEntry.errorMessage,
        auditEntry.ipAddress,
        auditEntry.userAgent,
        auditEntry.metadata ? JSON.stringify(auditEntry.metadata) : null,
        auditEntry.timestamp
      ]);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log security events (unauthorized access, suspicious activity)
   * @param auditEntry - Security audit entry
   */
  async logSecurityEvent(auditEntry: AuditLogEntry): Promise<void> {
    try {
      // Log to both audit_logs and security_events tables
      await Promise.all([
        this.logAuditEvent(auditEntry),
        pool.query(`
          INSERT INTO security_events (
            user_id, user_role, event_type, resource_type, resource_id,
            severity, description, ip_address, user_agent, metadata, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          auditEntry.userId,
          auditEntry.userRole,
          auditEntry.action,
          auditEntry.resourceType,
          auditEntry.resourceId,
          auditEntry.metadata?.severity || 'low',
          auditEntry.errorMessage || 'Security event',
          auditEntry.ipAddress,
          auditEntry.userAgent,
          auditEntry.metadata ? JSON.stringify(auditEntry.metadata) : null,
          auditEntry.timestamp
        ])
      ]);

      // If this is a high-severity event, consider additional alerting
      if (auditEntry.metadata?.severity === 'high') {
        console.warn('High-severity security event:', {
          userId: auditEntry.userId,
          action: auditEntry.action,
          resourceType: auditEntry.resourceType,
          resourceId: auditEntry.resourceId,
          timestamp: auditEntry.timestamp
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param limit - Number of logs to retrieve
   * @param offset - Offset for pagination
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM audit_logs
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userRole: row.user_role,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        success: row.success,
        errorMessage: row.error_message,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events for monitoring
   * @param severity - Filter by severity level
   * @param limit - Number of events to retrieve
   * @param offset - Offset for pagination
   * @returns Promise<any[]> - Array of security events
   */
  async getSecurityEvents(
    severity?: 'low' | 'medium' | 'high',
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      let query = `
        SELECT * FROM security_events
        ${severity ? 'WHERE severity = $1' : ''}
        ORDER BY timestamp DESC
        LIMIT ${severity ? '$2' : '$1'} OFFSET ${severity ? '$3' : '$2'}
      `;

      const params = severity ? [severity, limit, offset] : [limit, offset];
      const result = await pool.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userRole: row.user_role,
        eventType: row.event_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        severity: row.severity,
        description: row.description,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('Failed to retrieve security events:', error);
      return [];
    }
  }

  /**
   * Get partner access statistics
   * @param partnerId - Partner ID
   * @param days - Number of days to look back
   * @returns Promise<any> - Access statistics
   */
  async getPartnerAccessStats(partnerId: string, days: number = 30): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_accesses,
          COUNT(*) FILTER (WHERE success = true) as successful_accesses,
          COUNT(*) FILTER (WHERE success = false) as failed_accesses,
          COUNT(DISTINCT resource_id) as unique_clients_accessed,
          COUNT(*) FILTER (WHERE action = 'client_view') as client_views,
          COUNT(*) FILTER (WHERE action = 'client_list') as client_lists
        FROM audit_logs
        WHERE user_id = $1
        AND user_role = 'partner'
        AND resource_type = 'client'
        AND timestamp >= NOW() - INTERVAL '${days} days'
      `, [partnerId]);

      return result.rows[0] || {
        total_accesses: 0,
        successful_accesses: 0,
        failed_accesses: 0,
        unique_clients_accessed: 0,
        client_views: 0,
        client_lists: 0
      };
    } catch (error) {
      console.error('Failed to get partner access stats:', error);
      return {
        total_accesses: 0,
        successful_accesses: 0,
        failed_accesses: 0,
        unique_clients_accessed: 0,
        client_views: 0,
        client_lists: 0
      };
    }
  }
}