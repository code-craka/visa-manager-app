# Client Management Design Document

## Overview

The Client Management system is designed as a comprehensive CRUD interface that integrates seamlessly with the existing Visa Manager App architecture. It leverages the established Clerk JWT authentication, PostgreSQL with Row-Level Security, and React Native with Material Design components. The system provides real-time capabilities through WebSocket integration and maintains high performance through optimized database queries and efficient React patterns.

## Architecture

### System Architecture

The client management feature follows a three-tier architecture:

1. **Presentation Layer**: React Native components with Material Design
2. **API Layer**: Node.js/Express RESTful endpoints with JWT middleware
3. **Data Layer**: PostgreSQL with Row-Level Security policies

### Integration Points

- **Authentication**: Integrates with existing Clerk JWT templates
- **Real-time Updates**: Uses established WebSocket service for live data
- **Task Assignment**: Provides client selection interface for task creation
- **Dashboard**: Feeds statistics to the main dashboard component

## Components and Interfaces

### Frontend Components

#### ClientListScreen
```typescript
interface ClientListScreenProps {
  navigation: NavigationProp<any>;
}

interface ClientListState {
  clients: Client[];
  filteredClients: Client[];
  searchQuery: string;
  selectedStatus: ClientStatus | 'all';
  sortBy: 'name' | 'date' | 'visaType';
  loading: boolean;
  refreshing: boolean;
}
```

**Key Features:**
- Debounced search with 300ms delay
- Status filter chips with Material Design
- Pull-to-refresh functionality
- Infinite scroll for large datasets
- Real-time updates via WebSocket

#### ClientFormScreen
```typescript
interface ClientFormScreenProps {
  navigation: NavigationProp<any>;
  route: {
    params?: {
      clientId?: number;
      mode: 'create' | 'edit';
    };
  };
}

interface ClientFormState {
  formData: ClientFormData;
  errors: ValidationErrors;
  loading: boolean;
  saving: boolean;
}
```

**Key Features:**
- Form validation with real-time feedback
- Material Design input components
- Auto-save draft functionality
- Optimistic UI updates

#### ClientSelectionModal
```typescript
interface ClientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  excludeIds?: number[];
}
```

**Key Features:**
- Modal interface for task assignment
- Search and filter capabilities
- Visual client status indicators
- Visa type icons

### Backend Components

#### Client Model
```typescript
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  visaType: VisaType;
  status: ClientStatus;
  notes?: string;
  agencyId: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

enum VisaType {
  TOURIST = 'tourist',
  BUSINESS = 'business',
  STUDENT = 'student',
  WORK = 'work',
  FAMILY = 'family',
  TRANSIT = 'transit'
}

enum ClientStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DOCUMENTS_REQUIRED = 'documents_required',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}
```

#### Client Service
```typescript
class ClientService {
  async createClient(clientData: CreateClientRequest, userId: string): Promise<Client>;
  async getClients(userId: string, filters?: ClientFilters): Promise<Client[]>;
  async getClientById(id: number, userId: string): Promise<Client>;
  async updateClient(id: number, updates: UpdateClientRequest, userId: string): Promise<Client>;
  async deleteClient(id: number, userId: string): Promise<void>;
  async getClientStats(userId: string): Promise<ClientStats>;
}
```

#### Client Controller
```typescript
class ClientController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void>;
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void>;
  async getById(req: AuthenticatedRequest, res: Response): Promise<void>;
  async update(req: AuthenticatedRequest, res: Response): Promise<void>;
  async delete(req: AuthenticatedRequest, res: Response): Promise<void>;
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void>;
}
```

## Data Models

### Database Schema

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  visa_type VARCHAR(50) NOT NULL CHECK (visa_type IN ('tourist', 'business', 'student', 'work', 'family', 'transit')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'documents_required', 'under_review', 'approved', 'rejected', 'completed')),
  notes TEXT,
  agency_id VARCHAR(255) NOT NULL, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_visa_type ON clients(visa_type);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_name_search ON clients USING gin(to_tsvector('english', name));
CREATE INDEX idx_clients_email_search ON clients USING gin(to_tsvector('english', email));

-- Row-Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy for agencies to access only their clients
CREATE POLICY clients_agency_access ON clients
  FOR ALL
  TO authenticated
  USING (agency_id = auth.jwt() ->> 'sub');

-- Policy for partners to access clients through tasks
CREATE POLICY clients_partner_access ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.client_id = clients.id
      AND t.assigned_to = auth.jwt() ->> 'sub'
    )
  );
```

### API Endpoints

```typescript
// Client CRUD endpoints
POST   /api/clients              // Create new client
GET    /api/clients              // Get all clients with filters
GET    /api/clients/:id          // Get specific client
PUT    /api/clients/:id          // Update client
DELETE /api/clients/:id          // Delete client
GET    /api/clients/stats        // Get client statistics

// Query parameters for GET /api/clients
interface ClientFilters {
  search?: string;           // Search in name, email
  status?: ClientStatus;     // Filter by status
  visaType?: VisaType;      // Filter by visa type
  sortBy?: 'name' | 'date' | 'visaType';
  sortOrder?: 'asc' | 'desc';
  page?: number;            // Pagination
  limit?: number;           // Items per page
}
```

## Error Handling

### Frontend Error Handling

```typescript
interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorType: 'network' | 'validation' | 'permission' | 'unknown';
}

class ClientErrorBoundary extends React.Component<Props, ErrorState> {
  // Handle React errors gracefully
  // Display user-friendly error messages
  // Provide retry mechanisms
}
```

### Backend Error Handling

```typescript
class ClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string
  ) {
    super(message);
  }
}

// Error types
const CLIENT_ERRORS = {
  NOT_FOUND: { code: 'CLIENT_NOT_FOUND', status: 404 },
  VALIDATION_FAILED: { code: 'VALIDATION_FAILED', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 403 },
  DUPLICATE_EMAIL: { code: 'DUPLICATE_EMAIL', status: 409 },
  HAS_ACTIVE_TASKS: { code: 'HAS_ACTIVE_TASKS', status: 409 }
};
```

### Validation Rules

```typescript
const clientValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 255,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  },
  phone: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]+$/,
    maxLength: 50
  },
  visaType: {
    required: true,
    enum: Object.values(VisaType)
  },
  status: {
    required: true,
    enum: Object.values(ClientStatus)
  },
  notes: {
    required: false,
    maxLength: 2000
  }
};
```

## Testing Strategy

### Unit Testing

**Frontend Tests:**
- Component rendering and props handling
- Form validation logic
- Search and filter functionality
- WebSocket integration
- Error boundary behavior

**Backend Tests:**
- Service layer business logic
- Controller request/response handling
- Database query operations
- Authentication middleware
- Row-Level Security policies

### Integration Testing

**API Integration:**
- End-to-end CRUD operations
- Authentication flow with JWT templates
- Real-time WebSocket updates
- Error handling scenarios
- Performance under load

**Database Integration:**
- RLS policy enforcement
- Query performance optimization
- Data integrity constraints
- Migration scripts

### Test Data

```typescript
const mockClients: Client[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.PENDING,
    notes: 'Urgent business visa application',
    agencyId: 'user_123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user_123',
    updatedBy: 'user_123'
  }
  // Additional test data...
];
```

## Performance Considerations

### Frontend Optimization

- **React.memo** for pure components to prevent unnecessary re-renders
- **useMemo** for expensive calculations (filtered/sorted lists)
- **useCallback** for event handlers to maintain referential equality
- **Virtual scrolling** for large client lists (react-native-super-grid)
- **Debounced search** to reduce API calls
- **Optimistic updates** for better perceived performance

### Backend Optimization

- **Database indexing** on frequently queried columns
- **Connection pooling** for efficient database connections
- **Query optimization** with proper JOIN strategies
- **Caching** for frequently accessed data (Redis integration)
- **Pagination** to limit response sizes
- **Parallel processing** for bulk operations

### Real-time Updates

```typescript
// WebSocket event types for client management
interface ClientWebSocketEvents {
  'client:created': { client: Client };
  'client:updated': { client: Client };
  'client:deleted': { clientId: number };
  'client:stats': { stats: ClientStats };
}

// Real-time update handling
class ClientRealtimeService {
  private ws: WebSocketService;
  
  subscribeToClientUpdates(agencyId: string): void {
    this.ws.subscribe(`clients:${agencyId}`, this.handleClientUpdate);
  }
  
  private handleClientUpdate = (event: ClientWebSocketEvents) => {
    // Update local state
    // Trigger UI re-renders
    // Show notifications
  };
}
```

## Security Considerations

### Data Protection

- **Row-Level Security** ensures users only access authorized data
- **Input sanitization** prevents SQL injection and XSS attacks
- **JWT validation** on all API endpoints
- **Rate limiting** to prevent abuse
- **Audit logging** for all data modifications

### Privacy Compliance

- **Data minimization** - partners see only task-relevant client info
- **Encryption at rest** for sensitive client data
- **Secure data transmission** via HTTPS/WSS
- **Data retention policies** for client records
- **GDPR compliance** considerations for international clients

## Deployment Considerations

### Database Migrations

```sql
-- Migration script for client management
-- Version: 001_create_clients_table.sql

BEGIN;

-- Create clients table
CREATE TABLE clients (
  -- Schema definition as above
);

-- Create indexes
-- Create RLS policies
-- Insert initial data if needed

COMMIT;
```

### Environment Configuration

```typescript
// Environment variables for client management
interface ClientConfig {
  MAX_CLIENTS_PER_AGENCY: number;
  CLIENT_SEARCH_DEBOUNCE_MS: number;
  CLIENT_LIST_PAGE_SIZE: number;
  ENABLE_CLIENT_AUDIT_LOG: boolean;
  CLIENT_CACHE_TTL_SECONDS: number;
}
```

This design provides a robust, scalable, and secure foundation for the client management feature while maintaining consistency with the existing Visa Manager App architecture.