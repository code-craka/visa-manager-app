# Visa Manager App - API Documentation

## Overview

The Visa Manager App provides a comprehensive RESTful API built with Node.js, Express, and TypeScript. All endpoints use JWT authentication with Clerk integration and follow REST conventions with proper HTTP status codes.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints (except test endpoints) require JWT authentication using Clerk JWT templates.

### Headers Required

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### JWT Token Structure

```json
{
  "email": "user@example.com",
  "role": "agency|partner",
  "name": "User Name",
  "iss": "https://clerk.techsci.io",
  "aud": "your_clerk_publishable_key"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": <response_data>,
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

## Authentication Endpoints

### Sync User with Backend

**POST** `/auth/sync-user`

Synchronizes Clerk user with the backend database.

**Request Body:**
```json
{
  "role": "agency|partner"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clerkUserId": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "agency",
    "createdAt": "2025-08-09T10:00:00Z"
  }
}
```

### Get User Profile

**GET** `/auth/profile`

Retrieves the current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clerkUserId": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "agency",
    "createdAt": "2025-08-09T10:00:00Z"
  }
}
```

### Get All Users (Agency Only)

**GET** `/auth/users`

Retrieves all users in the system. Only accessible by agency users.

**Query Parameters:**
- `role` (optional): Filter by role (`agency`, `partner`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "clerkUserId": "user_123",
      "email": "user@example.com",
      "name": "User Name",
      "role": "agency",
      "createdAt": "2025-08-09T10:00:00Z"
    }
  ]
}
```

## Client Management Endpoints

### Create Client (Agency Only)

**POST** `/clients`

Creates a new client. Only accessible by agency users.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "visaType": "tourist|business|student|work|family|other",
  "status": "pending|in_progress|under_review|completed|approved|rejected",
  "notes": "Optional notes about the client"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "visaType": "tourist",
    "status": "pending",
    "notes": "Optional notes",
    "createdBy": "user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T10:00:00Z"
  },
  "message": "Client created successfully"
}
```

### Get All Clients

**GET** `/clients`

Retrieves all clients with filtering, searching, sorting, and pagination.

**Query Parameters:**
- `search` (optional): Search by name, email, or visa type
- `status` (optional): Filter by status
- `visaType` (optional): Filter by visa type
- `sortBy` (optional): Sort by `name`, `date`, or `visaType` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**
```
GET /clients?search=john&status=pending&sortBy=name&sortOrder=asc&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "visaType": "tourist",
      "status": "pending",
      "notes": "Optional notes",
      "createdBy": "user_123",
      "createdAt": "2025-08-09T10:00:00Z",
      "updatedAt": "2025-08-09T10:00:00Z"
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

### Get Client by ID

**GET** `/clients/:id`

Retrieves a specific client by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "visaType": "tourist",
    "status": "pending",
    "notes": "Optional notes",
    "createdBy": "user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T10:00:00Z"
  }
}
```

### Update Client (Agency Only)

**PUT** `/clients/:id`

Updates a client. Only accessible by agency users.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567891",
  "visaType": "business",
  "status": "in_progress",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "phone": "+1234567891",
    "visaType": "business",
    "status": "in_progress",
    "notes": "Updated notes",
    "createdBy": "user_123",
    "createdAt": "2025-08-09T10:00:00Z",
    "updatedAt": "2025-08-09T11:00:00Z"
  },
  "message": "Client updated successfully"
}
```

### Delete Client (Agency Only)

**DELETE** `/clients/:id`

Deletes a client. Only accessible by agency users. Prevents deletion if client has active tasks.

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

### Get Client Statistics (Agency Only)

**GET** `/clients/stats`

Retrieves client statistics for dashboard. Only accessible by agency users.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClients": 150,
    "statusBreakdown": {
      "pending": 25,
      "in_progress": 40,
      "under_review": 15,
      "completed": 50,
      "approved": 15,
      "rejected": 5
    },
    "visaTypeBreakdown": {
      "tourist": 60,
      "business": 40,
      "student": 25,
      "work": 15,
      "family": 8,
      "other": 2
    },
    "recentClients": 12,
    "completionRate": 85.5
  }
}
```

### Get Clients for Task Assignment (Agency Only)

**GET** `/clients/for-assignment`

Retrieves a simplified list of clients for task assignment. Only accessible by agency users.

**Query Parameters:**
- `exclude` (optional): Comma-separated list of client IDs to exclude

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "visaType": "tourist",
      "status": "pending"
    }
  ]
}
```

## Task Management Endpoints

### Create Task (Agency Only)

**POST** `/tasks`

Creates a new task.

**Request Body:**
```json
{
  "client_id": 1,
  "assigned_to": 2,
  "task_type": "fingerprint|medical|document_review|interview_prep|other",
  "description": "Task description",
  "commission": 100.00,
  "due_date": "2025-08-15T10:00:00Z"
}
```

### Get All Tasks

**GET** `/tasks`

Retrieves all tasks for the current user.

### Get Task by ID

**GET** `/tasks/:id`

Retrieves a specific task by ID.

### Update Task

**PUT** `/tasks/:id`

Updates a task. Partners can update status, agencies can update everything.

### Delete Task (Agency Only)

**DELETE** `/tasks/:id`

Deletes a task. Only accessible by agency users.

### Get Commission Report

**GET** `/tasks/partner/:partnerId/commission-report`

Retrieves commission report for a specific partner.

## Dashboard Endpoints

### Agency Dashboard

**GET** `/dashboard/agency`

Retrieves dashboard data for agency users.

### Partner Dashboard

**GET** `/dashboard/partner`

Retrieves dashboard data for partner users.

### Analytics (Agency Only)

**GET** `/dashboard/analytics`

Retrieves analytics data. Only accessible by agency users.

## Notification Endpoints

### Get All Notifications

**GET** `/notifications`

Retrieves all notifications for the current user.

### Get Unread Count

**GET** `/notifications/unread/count`

Retrieves the count of unread notifications.

### Create Notification

**POST** `/notifications`

Creates a new notification.

### Mark as Read

**PUT** `/notifications/:id/read`

Marks a notification as read.

### Mark All as Read

**PUT** `/notifications/read-all`

Marks all notifications as read.

### Delete Notification

**DELETE** `/notifications/:id`

Deletes a notification.

## Error Codes

### Client Management Error Codes

- `CLIENT_NOT_FOUND` - Client with specified ID not found
- `CLIENT_VALIDATION_ERROR` - Validation failed for client data
- `CLIENT_HAS_ACTIVE_TASKS` - Cannot delete client with active tasks
- `INVALID_ID` - Invalid client ID format
- `RETRIEVAL_FAILED` - Failed to retrieve clients
- `STATS_FAILED` - Failed to retrieve client statistics
- `INTERNAL_ERROR` - Internal server error

### Authentication Error Codes

- `UNAUTHORIZED` - Missing or invalid JWT token
- `FORBIDDEN` - Insufficient permissions for the requested action
- `USER_NOT_FOUND` - User not found in database
- `SYNC_FAILED` - Failed to sync user with backend

### Validation Error Codes

- `REQUIRED_FIELD` - Required field is missing
- `INVALID_EMAIL` - Invalid email format
- `INVALID_PHONE` - Invalid phone number format
- `INVALID_ENUM` - Invalid enum value (status, visa type, etc.)
- `STRING_TOO_LONG` - String exceeds maximum length
- `STRING_TOO_SHORT` - String below minimum length

## Rate Limiting

- **General endpoints**: 100 requests per minute per user
- **Search endpoints**: 30 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP

## Pagination

All list endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Pagination information is included in the response metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

## Testing

### JWT Test Endpoint

**GET** `/test/jwt-test`

Tests JWT template integration. Requires valid JWT token.

**Response:**
```json
{
  "success": true,
  "message": "JWT template integration working correctly",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "agency",
    "name": "User Name"
  }
}
```

## cURL Examples

### Create Client

```bash
curl -X POST https://your-domain.com/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "visaType": "tourist",
    "status": "pending",
    "notes": "New client for tourist visa"
  }'
```

### Get Clients with Filtering

```bash
curl -X GET "https://your-domain.com/api/clients?search=john&status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Client

```bash
curl -X PUT https://your-domain.com/api/clients/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Updated status to in progress"
  }'
```

### Get Client Statistics

```bash
curl -X GET https://your-domain.com/api/clients/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## SDK Integration

### JavaScript/TypeScript

```typescript
import ApiService from './services/ApiService';

// Set authentication token
ApiService.setAuthTokenGetter(() => getToken());

// Create client
const response = await ApiService.createClient({
  name: 'John Doe',
  email: 'john@example.com',
  visaType: 'tourist',
  status: 'pending'
});

// Get clients with filtering
const clients = await ApiService.getClients({
  search: 'john',
  status: 'pending',
  page: 1,
  limit: 20
});
```

## Changelog

- **v0.3.1** - Complete client management API implementation
- **v0.3.0** - JWT template integration and authentication overhaul
- **v0.2.0** - Initial API structure and basic endpoints

## Support

For API support and questions, please refer to the main project documentation or create an issue in the project repository.