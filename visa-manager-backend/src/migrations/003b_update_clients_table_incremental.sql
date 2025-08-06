-- Incremental Migration: Update existing clients table for client management feature
-- Version: 003b_update_clients_table_incremental.sql
-- Use this if you want to preserve existing client data

BEGIN;

-- First, let's check what columns exist
-- (Run this separately first to see current structure)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE clients ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
        ALTER TABLE clients ADD COLUMN phone VARCHAR(50);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes') THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
    END IF;
    
    -- Add agency_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'agency_id') THEN
        ALTER TABLE clients ADD COLUMN agency_id VARCHAR(255);
    END IF;
    
    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_by') THEN
        ALTER TABLE clients ADD COLUMN updated_by VARCHAR(255);
    END IF;
END $$;

-- Update created_by column to VARCHAR if it's currently INTEGER
DO $$
BEGIN
    -- Check if created_by is INTEGER and convert to VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'created_by' 
        AND data_type = 'integer'
    ) THEN
        -- Add temporary column
        ALTER TABLE clients ADD COLUMN created_by_temp VARCHAR(255);
        
        -- Copy data (you'll need to map integer IDs to Clerk user IDs manually)
        -- For now, we'll just convert to string - you'll need to update these later
        UPDATE clients SET created_by_temp = created_by::text;
        
        -- Drop old column and rename new one
        ALTER TABLE clients DROP COLUMN created_by;
        ALTER TABLE clients RENAME COLUMN created_by_temp TO created_by;
    END IF;
END $$;

-- If you have a passport column, you might want to migrate data to email
-- (This is just an example - adjust based on your actual data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'passport') THEN
        -- If email column is empty, you might want to populate it
        -- UPDATE clients SET email = passport || '@example.com' WHERE email IS NULL;
        
        -- Or drop passport column if no longer needed
        -- ALTER TABLE clients DROP COLUMN passport;
        
        RAISE NOTICE 'Passport column exists - you may need to migrate this data manually';
    END IF;
END $$;

-- Add constraints
DO $$
BEGIN
    -- Add CHECK constraint for visa_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'clients_visa_type_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_visa_type_check 
        CHECK (visa_type IN ('tourist', 'business', 'student', 'work', 'family', 'transit'));
    END IF;
    
    -- Add CHECK constraint for status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'clients_status_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_status_check 
        CHECK (status IN ('pending', 'in_progress', 'documents_required', 'under_review', 'approved', 'rejected', 'completed'));
    END IF;
END $$;

-- Update timestamp columns to use timezone
DO $$
BEGIN
    -- Update created_at to use timezone if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'created_at' 
        AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE clients ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Update updated_at to use timezone if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'updated_at' 
        AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE clients ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for performance optimization (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_visa_type ON clients(visa_type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Create full-text search indexes (only if email column exists and has data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(to_tsvector('english', name));
        CREATE INDEX IF NOT EXISTS idx_clients_email_search ON clients USING gin(to_tsvector('english', email));
    END IF;
END $$;

-- Create unique constraint for email per agency (only if both columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'agency_id') THEN
        -- Drop existing unique constraint if it exists
        DROP INDEX IF EXISTS idx_clients_email_agency_unique;
        -- Create new unique constraint (only if email is not null)
        CREATE UNIQUE INDEX idx_clients_email_agency_unique ON clients(email, agency_id) WHERE email IS NOT NULL;
    END IF;
END $$;

-- Enable Row-Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS clients_agency_access ON clients;
DROP POLICY IF EXISTS clients_partner_access ON clients;

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

-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE clients_id_seq TO authenticated;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- Post-migration notes:
-- 1. If you had a 'passport' column, you may need to migrate that data to 'email'
-- 2. You'll need to populate 'agency_id' with actual Clerk user IDs
-- 3. You'll need to populate 'email' column if it's currently NULL
-- 4. Update 'created_by' values to use Clerk user IDs instead of integer IDs