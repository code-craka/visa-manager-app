# Client Management API Documentation

## Overview

The Client Management API provides comprehensive CRUD operations for managing visa clients with role-based access control, advanced filtering, and real-time capabilities.

## Base URL

```
http://localhost:3000/api/clients
```

## Authentication

All endpoints require JWT authentication using Clerk JWT templates:

```http
Authorization: Bearer <jwt_token>
```

### JWT Claims Structure
```json
{
  "sub": "clerk_user_id",
  "email": "user@example.com", 
  "role": "agency|partner",
  "name": "User Name"
}
```

## Endpoints

### 1. Create Client

**POST** `/api/clients`

Creates a new client record. Requires agency role.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "visaType": "business",
  "status": "pending",
  "notes": "Urgent business visa application"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "visaType": "business",
    "status": "pending",
    "notes": "Urgent business visa application",
    "agencyId": "clerk_user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T10:00:00Z",
    "createdBy": "clerk_user_123",
    "updatedBy": "clerk_user_123"
  },
  "message": "Client created successfully"
}
```

#### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation failed",
  "errorCode": "VALIDATION_FAILED",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### 2. Get All Clients

**GET** `/api/clients`

Retrieves clients with filtering, searching, sorting, and pagination.

#### Query Parameters
- `search` (string): Search in name and email fields
- `status` (string): Filter by client status
- `visaType` (string): Filter by visa type
- `sortBy` (string): Sort by 'name', 'date', or 'visaType' (default: 'date')
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

#### Example Request
```http
GET /api/clients?search=john&status=pending&sortBy=name&sortOrder=asc&page=1&limit=10
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "visaType": "business",
      "status": "pending",
      "notes": "Urgent business visa application",
      "agencyId": "clerk_user_123",
      "createdAt": "2025-08-09T10:00:00Z",
      "updatedAt": "2025-08-09T10:00:00Z",
      "createdBy": "clerk_user_123",
      "updatedBy": "clerk_user_123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3
  }
}
```

### 3. Get Client by ID

**GET** `/api/clients/:id`

Retrieves a specific client by ID with RLS enforcement.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "visaType": "business",
    "status": "pending",
    "notes": "Urgent business visa application",
    "agencyId": "clerk_user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T10:00:00Z",
    "createdBy": "clerk_user_123",
    "updatedBy": "clerk_user_123"
  }
}
```

#### Not Found (404 Not Found)
```json
{
  "success": false,
  "error": "Client not found or access denied",
  "errorCode": "CLIENT_NOT_FOUND"
}
```

### 4. Update Client

**PUT** `/api/clients/:id`

Updates an existing client. Requires agency role.

#### Request Body (Partial Update)
```json
{
  "name": "John Updated",
  "status": "in_progress",
  "notes": "Updated notes"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "visaType": "business",
    "status": "in_progress",
    "notes": "Updated notes",
    "agencyId": "clerk_user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T11:00:00Z",
    "createdBy": "clerk_user_123",
    "updatedBy": "clerk_user_123"
  },
  "message": "Client updated successfully"
}
```

### 5. Delete Client

**DELETE** `/api/clients/:id`

Deletes a client. Requires agency role. Prevents deletion if client has active tasks.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

#### Has Active Tasks (409 Conflict)
```json
{
  "success": false,
  "error": "Cannot delete client with active tasks",
  "errorCode": "HAS_ACTIVE_TASKS"
}
```

### 6. Get Client Statistics

**GET** `/api/clients/stats`

Retrieves client statistics for dashboard. Requires agency role.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalClients": 25,
    "pending": 8,
    "inProgress": 5,
    "underReview": 3,
    "completed": 7,
    "approved": 2,
    "rejected": 0,
    "documentsRequired": 0
  }
}
```

### 7. Get Clients for Task Assignment

**GET** `/api/clients/for-assignment`

Retrieves simplified client list for task assignment. Requires agency role.

#### Query Parameters
- `exclude` (string): Comma-separated list of client IDs to exclude

#### Example Request
```http
GET /api/clients/for-assignment?exclude=1,2,3
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "visaType": "tourist",
      "status": "pending"
    },
    {
      "id": 5,
      "name": "Bob Johnson",
      "email": "bob.johnson@example.com",
      "visaType": "business",
      "status": "in_progress"
    }
  ]
}
```

## Data Models

### Client
```typescript
interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  visaType: VisaType;
  status: ClientStatus;
  notes?: string;
  agencyId: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Clerk user ID
  updatedBy: string; // Clerk user ID
}
```

### Visa Types
```typescript
enum VisaType {
  TOURIST = 'tourist',
  BUSINESS = 'business',
  STUDENT = 'student',
  WORK = 'work',
  FAMILY = 'family',
  TRANSIT = 'transit'
}
```

### Client Status
```typescript
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

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `CLIENT_NOT_FOUND` | 404 | Client not found or access denied |
| `VALIDATION_FAILED` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DUPLICATE_EMAIL` | 409 | Email already exists for agency |
| `HAS_ACTIVE_TASKS` | 409 | Cannot delete client with active tasks |
| `CREATION_FAILED` | 500 | Failed to create client |
| `UPDATE_FAILED` | 500 | Failed to update client |
| `DELETION_FAILED` | 500 | Failed to delete client |
| `RETRIEVAL_FAILED` | 500 | Failed to retrieve clients |
| `STATS_FAILED` | 500 | Failed to retrieve statistics |

## Security Features

### Row-Level Security (RLS)
- Agencies can only access their own clients
- Partners can only access clients through assigned tasks
- All queries enforce user-based data isolation

### Input Validation
- Comprehensive validation for all input fields
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

### Authentication & Authorization
- JWT token verification with JWKS
- Role-based access control (agency vs partner)
- Automatic token refresh handling

## Rate Limiting

All endpoints are subject to rate limiting:
- 100 requests per minute per user
- 1000 requests per hour per user

## Testing

The API includes comprehensive test coverage:
- Unit tests for all service methods
- Integration tests for all endpoints
- Authentication and authorization tests
- Error handling and edge case tests

Run tests with:
```bash
npm test
```

## Examples

### cURL Examples

#### Create Client
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "visaType": "business"
  }'
```

#### Get Clients with Filtering
```bash
curl -X GET "http://localhost:3000/api/clients?search=john&status=pending&page=1&limit=10" \
  -H "Authorization: Bearer <jwt_token>"
```

#### Update Client
```bash
curl -X PUT http://localhost:3000/api/clients/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "status": "in_progress",
    "notes": "Updated status"
  }'
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```typescript
// Create client
const response = await fetch('/api/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john.doe@example.com',
    visaType: 'business'
  })
});

const result = await response.json();
```

#### Using the ApiService
```typescript
import ApiService from './services/ApiService';

// Get clients with filtering
const response = await ApiService.getClients({
  search: 'john',
  status: ClientStatus.PENDING,
  page: 1,
  limit: 20
});

if (response.success) {
  console.log('Clients:', response.data);
  console.log('Pagination:', response.pagination);
}
```

This API provides a robust foundation for client management with enterprise-grade security, performance, and reliability features.