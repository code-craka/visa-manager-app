// Partner Client Service Tests
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 - Partner access controls and audit logging

import { PartnerClientService, RestrictedClient } from '../services/PartnerClientService';
import { AuditLogService } from '../services/AuditLogService';
import { ClientError } from '../services/ClientError';
import { VisaType, ClientStatus } from '../models/Client';

// Mock the database pool
jest.mock('../db', () => ({
  query: jest.fn()
}));

// Mock the AuditLogService
jest.mock('../services/AuditLogService');

describe('PartnerClientService', () => {
  let partnerClientService: PartnerClientService;
  let mockQuery: jest.Mock;
  let mockAuditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    partnerClientService = new PartnerClientService();
    mockQuery = require('../db').query;
    mockAuditLogService = new AuditLogService() as jest.Mocked<AuditLogService>;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Data Masking Implementation', () => {
    test('should mask email addresses correctly', () => {
      const service = new PartnerClientService();
      
      // Access private method for testing
      const maskEmail = (service as any).maskEmail.bind(service);
      
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
      expect(maskEmail('a@test.com')).toBe('a***@test.com');
      expect(maskEmail('ab@test.com')).toBe('ab***@test.com');
    });

    test('should mask phone numbers correctly', () => {
      const service = new PartnerClientService();
      
      // Access private method for testing
      const maskPhone = (service as any).maskPhone.bind(service);
      
      expect(maskPhone('+1-555-123-4567')).toBe('***-***-4567');
      expect(maskPhone('5551234567')).toBe('***-***-4567');
      expect(maskPhone('123')).toBe('***123');
    });

    test('should filter notes content for partners', () => {
      const service = new PartnerClientService();
      
      // Access private method for testing
      const filterNotesForPartner = (service as any).filterNotesForPartner.bind(service);
      
      const originalNotes = 'Client email: john@example.com, phone: 555-123-4567, passport: AB123456';
      const filteredNotes = filterNotesForPartner(originalNotes);
      
      expect(filteredNotes).toContain('[EMAIL_REDACTED]');
      expect(filteredNotes).toContain('[PHONE_REDACTED]');
      expect(filteredNotes).toContain('[ID_REDACTED]');
      expect(filteredNotes).not.toContain('john@example.com');
      expect(filteredNotes).not.toContain('555-123-4567');
      expect(filteredNotes).not.toContain('AB123456');
    });

    test('should truncate long notes for partners', () => {
      const service = new PartnerClientService();
      
      // Access private method for testing
      const filterNotesForPartner = (service as any).filterNotesForPartner.bind(service);
      
      const longNotes = 'A'.repeat(250);
      const filteredNotes = filterNotesForPartner(longNotes);
      
      expect(filteredNotes).toHaveLength(214); // 200 + '... [TRUNCATED]'
      expect(filteredNotes).toContain('[TRUNCATED]');
    });
  });

  describe('Partner Access Validation', () => {
    test('should validate partner access through tasks', async () => {
      const mockClientData = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        visa_type: 'business',
        status: 'pending',
        notes: 'Test notes',
        agency_id: 'agency-123',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'agency-123',
        updated_by: 'agency-123'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockClientData, task_id: 1 }]
      });

      const result = await partnerClientService.getPartnerAccessibleClientById(
        1,
        'partner-123',
        1,
        {
          partnerId: 'partner-123',
          accessType: 'view',
          clientId: 1,
          taskId: 1
        }
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('jo***@example.com'); // Masked
      expect(result.phone).toBe('***-***-4567'); // Masked
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN tasks t ON c.id = t.client_id'),
        [1, 'partner-123', 1]
      );
    });

    test('should throw error when partner has no access', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        partnerClientService.getPartnerAccessibleClientById(
          1,
          'partner-123',
          undefined,
          {
            partnerId: 'partner-123',
            accessType: 'view',
            clientId: 1
          }
        )
      ).rejects.toThrow(ClientError);
    });

    test('should check partner access correctly', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const hasAccess = await partnerClientService.hasPartnerAccess(1, 'partner-123');

      expect(hasAccess).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN tasks t ON c.id = t.client_id'),
        [1, 'partner-123']
      );
    });
  });

  describe('Audit Logging', () => {
    test('should log successful partner access', async () => {
      const mockClientData = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        visa_type: 'business',
        status: 'pending',
        notes: 'Test notes',
        agency_id: 'agency-123',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'agency-123',
        updated_by: 'agency-123'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockClientData, task_id: 1 }]
      });

      const accessContext = {
        partnerId: 'partner-123',
        accessType: 'view' as const,
        clientId: 1,
        taskId: 1,
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent'
      };

      await partnerClientService.getPartnerAccessibleClientById(
        1,
        'partner-123',
        1,
        accessContext
      );

      // Verify audit logging was called (mocked)
      expect(mockAuditLogService.logPartnerAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerId: 'partner-123',
          clientId: 1,
          taskId: 1,
          accessType: 'view',
          success: true
        })
      );
    });

    test('should log failed partner access attempts', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const accessContext = {
        partnerId: 'partner-123',
        accessType: 'view' as const,
        clientId: 1,
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent'
      };

      try {
        await partnerClientService.getPartnerAccessibleClientById(
          1,
          'partner-123',
          undefined,
          accessContext
        );
      } catch (error) {
        // Expected to throw
      }

      // Verify audit logging was called for failed attempt
      expect(mockAuditLogService.logPartnerAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerId: 'partner-123',
          clientId: 1,
          accessType: 'view',
          success: false,
          errorMessage: 'Unauthorized access attempt'
        })
      );
    });
  });

  describe('Client Data Masking', () => {
    test('should mask client data for partner view', () => {
      const service = new PartnerClientService();
      
      const fullClient = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        visaType: VisaType.BUSINESS,
        status: ClientStatus.PENDING,
        notes: 'Sensitive information: passport AB123456, email test@example.com',
        agencyId: 'agency-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'agency-123',
        updatedBy: 'agency-123'
      };

      // Access private method for testing
      const maskClientDataForPartner = (service as any).maskClientDataForPartner.bind(service);
      const maskedClient = maskClientDataForPartner(fullClient);

      expect(maskedClient.id).toBe(1);
      expect(maskedClient.name).toBe('John Doe');
      expect(maskedClient.email).toBe('jo***@example.com');
      expect(maskedClient.phone).toBe('***-***-4567');
      expect(maskedClient.visaType).toBe(VisaType.BUSINESS);
      expect(maskedClient.status).toBe(ClientStatus.PENDING);
      expect(maskedClient.notes).toContain('[ID_REDACTED]');
      expect(maskedClient.notes).toContain('[EMAIL_REDACTED]');
      
      // Sensitive fields should not be present
      expect(maskedClient).not.toHaveProperty('agencyId');
      expect(maskedClient).not.toHaveProperty('createdBy');
      expect(maskedClient).not.toHaveProperty('updatedBy');
    });
  });

  describe('Task Context Access', () => {
    test('should provide minimal client data for task context', async () => {
      const mockClientData = {
        id: 1,
        name: 'John Doe',
        visa_type: 'business',
        status: 'pending'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockClientData]
      });

      const result = await partnerClientService.getClientForTaskContext(
        1,
        'partner-123',
        1
      );

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        visaType: 'business',
        status: 'pending'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.id, c.name, c.visa_type, c.status'),
        [1, 'partner-123', 1]
      );
    });

    test('should throw error for invalid task context access', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        partnerClientService.getClientForTaskContext(1, 'partner-123', 1)
      ).rejects.toThrow(ClientError);
    });
  });

  describe('Service Integration', () => {
    test('should have proper service structure', () => {
      expect(partnerClientService).toBeInstanceOf(PartnerClientService);
      expect(typeof partnerClientService.getPartnerAccessibleClients).toBe('function');
      expect(typeof partnerClientService.getPartnerAccessibleClientById).toBe('function');
      expect(typeof partnerClientService.hasPartnerAccess).toBe('function');
      expect(typeof partnerClientService.getClientForTaskContext).toBe('function');
    });

    test('should initialize audit log service', () => {
      expect(partnerClientService['auditLogService']).toBeInstanceOf(AuditLogService);
    });
  });
});