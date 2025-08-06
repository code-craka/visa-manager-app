-- Migration: Create comprehensive clients table for client management feature
-- Version: 003_create_clients_table.sql
-- Requirements: 1.2, 7.1, 7.2, 7.3, 7.4

BEGIN;

-- Drop existing clients table if it exists (for clean migration)
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table with all required fields
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
  created_by VARCHAR(255) NOT NULL, -- Clerk user ID
  updated_by VARCHAR(255) NOT NULL  -- Clerk user ID
);

-- Create indexes for performance optimization
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_visa_type ON clients(visa_type);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name_search ON clients USING gin(to_tsvector('english', name));
CREATE INDEX idx_clients_email_search ON clients USING gin(to_tsvector('english', email));

-- Create unique constraint for email per agency (prevent duplicate emails within same agency)
CREATE UNIQUE INDEX idx_clients_email_agency_unique ON clients(email, agency_id);

-- Enable Row-Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for agencies to access only their clients
CREATE POLICY clients_agency_access ON clients
  FOR ALL
  TO authenticated
  USING (agency_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (agency_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policy for partners to access clients through tasks
CREATE POLICY clients_partner_access ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.client_id = clients.id
      AND u.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE clients_id_seq TO authenticated;

COMMIT;