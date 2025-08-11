-- Migration: Update existing tasks table to match new schema
-- Version: 0.3.2
-- Date: 2025-08-11

-- Add missing columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing columns to match new schema
ALTER TABLE tasks 
ALTER COLUMN assigned_to TYPE VARCHAR(255),
ALTER COLUMN created_by TYPE VARCHAR(255);

-- Add constraints for new columns
ALTER TABLE tasks 
ADD CONSTRAINT IF NOT EXISTS tasks_priority_check 
CHECK (priority IN ('urgent', 'high', 'medium', 'low'));

ALTER TABLE tasks 
ADD CONSTRAINT IF NOT EXISTS tasks_status_check 
CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE tasks 
ADD CONSTRAINT IF NOT EXISTS tasks_payment_status_check 
CHECK (payment_status IN ('unpaid', 'pending', 'paid'));

-- Update task_type constraint
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_task_type_check 
CHECK (task_type IN ('fingerprint', 'medical_exam', 'document_review', 'interview', 'translation', 'notarization', 'background_check', 'photo_service'));

-- Rename commission to commission_amount if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'commission') THEN
        ALTER TABLE tasks RENAME COLUMN commission TO commission_amount_old;
    END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Update existing data to have titles if missing
UPDATE tasks 
SET title = COALESCE(title, 'Task for ' || task_type)
WHERE title IS NULL OR title = '';

-- Make title NOT NULL after updating existing data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title') THEN
        ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;

-- Row Level Security (RLS) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tasks_agency_full_access ON tasks;
DROP POLICY IF EXISTS tasks_partner_assigned_access ON tasks;
DROP POLICY IF EXISTS tasks_partner_update_assigned ON tasks;

-- Policy: Agencies can see all tasks they created
CREATE POLICY tasks_agency_full_access ON tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.clerk_user_id = created_by 
            AND auth.users.role = 'agency'
        )
        AND created_by = (
            SELECT clerk_user_id FROM auth.users 
            WHERE clerk_user_id = current_setting('app.current_user_id', true)
        )
    );

-- Policy: Partners can see tasks assigned to them
CREATE POLICY tasks_partner_assigned_access ON tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.clerk_user_id = assigned_to 
            AND auth.users.role = 'partner'
        )
        AND assigned_to = (
            SELECT clerk_user_id FROM auth.users 
            WHERE clerk_user_id = current_setting('app.current_user_id', true)
        )
    );

-- Policy: Partners can update status and notes of their assigned tasks
CREATE POLICY tasks_partner_update_assigned ON tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.clerk_user_id = assigned_to 
            AND auth.users.role = 'partner'
        )
        AND assigned_to = (
            SELECT clerk_user_id FROM auth.users 
            WHERE clerk_user_id = current_setting('app.current_user_id', true)
        )
    )
    WITH CHECK (
        -- Partners can only update specific fields
        OLD.id = NEW.id
        AND OLD.title = NEW.title
        AND OLD.client_id = NEW.client_id
        AND OLD.assigned_to = NEW.assigned_to
        AND OLD.created_by = NEW.created_by
        AND OLD.task_type = NEW.task_type
        AND OLD.commission_amount = NEW.commission_amount
        AND OLD.commission_percentage = NEW.commission_percentage
        AND OLD.due_date = NEW.due_date
        AND OLD.assigned_date = NEW.assigned_date
        AND OLD.created_at = NEW.created_at
    );

-- Add comments for documentation
COMMENT ON COLUMN tasks.task_type IS 'Task types: fingerprint, medical_exam, document_review, interview, translation, notarization, background_check, photo_service';
COMMENT ON COLUMN tasks.priority IS 'Priority levels: urgent (red), high (orange), medium (blue), low (gray)';
COMMENT ON COLUMN tasks.status IS 'Status flow: pending -> assigned -> in_progress -> completed/cancelled';
COMMENT ON COLUMN tasks.payment_status IS 'Payment tracking: unpaid -> pending -> paid';