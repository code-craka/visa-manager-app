# Database Migrations

This directory contains SQL migration scripts for the Visa Manager App database.

## Migration Files

### 001_migrate_to_clerk.sql
- **Purpose**: Migrates from neon_user_id to clerk_user_id for Clerk authentication integration
- **Status**: Applied
- **Requirements**: Clerk JWT template integration

### 002_setup_auth_schema.sql
- **Purpose**: Sets up auth schema and functions for Neon + Clerk integration
- **Status**: Applied
- **Requirements**: JWT claim extraction functions

### 003_create_clients_table.sql
- **Purpose**: Creates comprehensive clients table for client management feature
- **Status**: Ready to apply
- **Requirements**: Client management feature (Requirements 1.2, 7.1, 7.2, 7.3, 7.4)

## How to Apply Migrations

### Manual Application (Recommended for Production)

1. Connect to your Neon database console
2. Copy and paste the SQL content from the migration file
3. Execute the SQL commands
4. Verify the changes using the test script

### Automated Application (Development)

```bash
# Run the test script to verify schema
node test-client-schema.js
```

## Migration 003 Details

### Tables Created
- `clients` - Main client information table with comprehensive fields

### Indexes Created
- `idx_clients_agency_id` - Performance for agency-based queries
- `idx_clients_status` - Performance for status filtering
- `idx_clients_visa_type` - Performance for visa type filtering
- `idx_clients_created_at` - Performance for date sorting
- `idx_clients_email` - Performance for email lookups
- `idx_clients_name_search` - Full-text search on client names
- `idx_clients_email_search` - Full-text search on client emails
- `idx_clients_email_agency_unique` - Unique constraint for email per agency

### RLS Policies Created
- `clients_agency_access` - Agencies can only access their own clients
- `clients_partner_access` - Partners can only access clients through assigned tasks

### Triggers Created
- `update_clients_updated_at` - Automatically updates the updated_at timestamp

### Permissions Granted
- `SELECT, INSERT, UPDATE, DELETE` on clients table for authenticated users
- `USAGE, SELECT` on clients sequence for authenticated users

## Schema Validation

The migration includes comprehensive validation:

1. **Data Types**: Proper PostgreSQL data types for all fields
2. **Constraints**: CHECK constraints for enum values
3. **Indexes**: Performance-optimized indexes for common queries
4. **RLS**: Row-Level Security for multi-tenant access control
5. **Triggers**: Automatic timestamp management

## Rollback Strategy

To rollback migration 003:

```sql
-- Drop the clients table and all related objects
DROP TABLE IF EXISTS clients CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Testing

Use the provided test script to verify the migration:

```bash
node test-client-schema.js
```

This will verify:
- Table structure
- Index creation
- RLS policy setup
- Constraint validation