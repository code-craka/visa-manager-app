// Unit tests for ClientService
// Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 4.1, 4.2

describe('ClientService', () => {
  // Mock database pool
  const mockQuery = jest.fn();
  
  beforeAll(() => {
    // Mock the database module
    jest.doMock('../db.js', () => ({
      default: {
        query: mockQuery,
      },
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Layer Implementation', () => {
    it('should have ClientService class implemented', async () => {
      // Import after mocking
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      expect(clientService).toBeDefined();
      expect(typeof clientService.createClient).toBe('function');
      expect(typeof clientService.getAllClients).toBe('function');
      expect(typeof clientService.getClientById).toBe('function');
      expect(typeof clientService.updateClient).toBe('function');
      expect(typeof clientService.deleteClient).toBe('function');
      expect(typeof clientService.getClientStats).toBe('function');
    });

    it('should have ClientError class with proper error codes', async () => {
      const { ClientError, CLIENT_ERRORS } = await import('../services/ClientError.js');
      
      expect(ClientError).toBeDefined();
      expect(CLIENT_ERRORS).toBeDefined();
      expect(CLIENT_ERRORS.NOT_FOUND).toBeDefined();
      expect(CLIENT_ERRORS.VALIDATION_FAILED).toBeDefined();
      expect(CLIENT_ERRORS.DUPLICATE_EMAIL).toBeDefined();
      expect(CLIENT_ERRORS.HAS_ACTIVE_TASKS).toBeDefined();
    });

    it('should have validation functions implemented', async () => {
      const { validateCreateClientRequest, validateUpdateClientRequest } = await import('../models/ClientValidation.js');
      
      expect(typeof validateCreateClientRequest).toBe('function');
      expect(typeof validateUpdateClientRequest).toBe('function');
    });

    it('should validate create client request with valid data', async () => {
      const { validateCreateClientRequest } = await import('../models/Client.js');
      
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        visa_type: 'business' as any, // Use string to avoid enum issues
      };

      const result = validateCreateClientRequest(validData);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate update client request with valid data', async () => {
      const { validateUpdateClientRequest } = await import('../models/Client.js');
      
      const validData = {
        name: 'John Updated',
      };

      const result = validateUpdateClientRequest(validData);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have proper error handling in createClient', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const { ClientError } = await import('../services/ClientError.js');
      const clientService = new ClientService();

      // Mock validation failure
      const invalidData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        visa_type: 'business' as any,
      };

      try {
        await clientService.createClient(invalidData, 'test-agency-id');
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ClientError);
        expect((error as any).statusCode).toBe(400);
      }
    });

    it('should have proper error handling in getClientById', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const { ClientError } = await import('../services/ClientError.js');
      const clientService = new ClientService();

      try {
        await clientService.getClientById(0, 'test-agency-id'); // Invalid ID
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ClientError);
        expect((error as any).statusCode).toBe(400);
      }
    });

    it('should have proper error handling in updateClient', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const { ClientError } = await import('../services/ClientError.js');
      const clientService = new ClientService();

      try {
        await clientService.updateClient(1, {}, 'test-agency-id'); // Empty updates
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ClientError);
        expect((error as any).statusCode).toBe(400);
      }
    });

    it('should have proper error handling in deleteClient', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const { ClientError } = await import('../services/ClientError.js');
      const clientService = new ClientService();

      try {
        await clientService.deleteClient(-1, 'test-agency-id'); // Invalid ID
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ClientError);
        expect((error as any).statusCode).toBe(400);
      }
    });

    it('should have input validation schema implemented', async () => {
      const { clientValidationRules } = await import('../models/ClientValidation.js');
      
      expect(clientValidationRules).toBeDefined();
      expect(clientValidationRules.name).toBeDefined();
      expect(clientValidationRules.email).toBeDefined();
      expect(clientValidationRules.visa_type).toBeDefined();
      expect(clientValidationRules.status).toBeDefined();
    });

    it('should have sanitization function implemented', async () => {
      const { sanitizeClientData } = await import('../models/ClientValidation.js');
      
      expect(typeof sanitizeClientData).toBe('function');
      
      const testData = {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        visa_type: 'business' as any,
      };

      const sanitized = sanitizeClientData(testData);
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.email).toBe('john@example.com');
    });

    it('should have utility methods in ClientService', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      expect(typeof clientService.clientExists).toBe('function');
      expect(typeof clientService.validateClientData).toBe('function');
      expect(typeof clientService.getClientsForTaskAssignment).toBe('function');
    });

    it('should validate client data without database calls', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        visa_type: 'business' as any,
      };

      const result = clientService.validateClientData(validData, false);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('CRUD Operations Implementation', () => {
    it('should have all required CRUD methods', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      // Verify all CRUD methods exist
      expect(typeof clientService.createClient).toBe('function');
      expect(typeof clientService.getAllClients).toBe('function');
      expect(typeof clientService.getClientById).toBe('function');
      expect(typeof clientService.updateClient).toBe('function');
      expect(typeof clientService.deleteClient).toBe('function');
    });

    it('should have statistics calculation method', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      expect(typeof clientService.getClientStats).toBe('function');
    });

    it('should have proper method signatures', async () => {
      const { ClientService } = await import('../services/ClientService.js');
      const clientService = new ClientService();
      
      // Check method signatures by examining function length (parameter count)
      expect(clientService.createClient.length).toBe(2); // clientData, agencyId
      expect(clientService.getAllClients.length).toBe(2); // agencyId, filters
      expect(clientService.getClientById.length).toBe(2); // id, agencyId
      expect(clientService.updateClient.length).toBe(3); // id, updates, agencyId
      expect(clientService.deleteClient.length).toBe(2); // id, agencyId
      expect(clientService.getClientStats.length).toBe(1); // agencyId
    });
  });

  describe('Error Handling Implementation', () => {
    it('should have custom ClientError class', async () => {
      const { ClientError } = await import('../services/ClientError.js');
      
      const error = new ClientError('Test error', 400, 'TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error');
    });

    it('should have error factory functions', async () => {
      const { 
        createClientNotFoundError,
        createValidationError,
        createDuplicateEmailError,
        createActiveTasksError,
        createDatabaseError,
        createInternalError
      } = await import('../services/ClientError.js');
      
      expect(typeof createClientNotFoundError).toBe('function');
      expect(typeof createValidationError).toBe('function');
      expect(typeof createDuplicateEmailError).toBe('function');
      expect(typeof createActiveTasksError).toBe('function');
      expect(typeof createDatabaseError).toBe('function');
      expect(typeof createInternalError).toBe('function');
    });

    it('should create proper error instances', async () => {
      const { 
        createClientNotFoundError,
        createValidationError,
        CLIENT_ERRORS
      } = await import('../services/ClientError.js');
      
      const notFoundError = createClientNotFoundError(123);
      expect(notFoundError.statusCode).toBe(404);
      expect(notFoundError.errorCode).toBe(CLIENT_ERRORS.NOT_FOUND.code);
      
      const validationError = createValidationError(['Name is required']);
      expect(validationError.statusCode).toBe(400);
      expect(validationError.errorCode).toBe(CLIENT_ERRORS.VALIDATION_FAILED.code);
    });
  });
});