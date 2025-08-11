-- Migration: Create tasks table with comprehensive task management features
-- Version: 0.3.2
-- Date: 2025-08-11

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to VARCHAR(255), -- Clerk user ID of assigned partner
    created_by VARCHAR(255) NOT NULL, -- Clerk user ID of agency user who created the task
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    task_type VARCHAR(50) NOT NULL, -- e.g., 'fingerprint', 'medical_exam', 'document_review', 'interview'
    commission_amount DECIMAL(10, 2) DEFAULT 0.00,
    commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid')),
    due_date TIMESTAMP,
    assigned_date TIMESTAMP,
    completed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

-- Add sample task types for reference
COMMENT ON COLUMN tasks.task_type IS 'Task types: fingerprint, medical_exam, document_review, interview, translation, notarization, background_check, photo_service';
COMMENT ON COLUMN tasks.priority IS 'Priority levels: urgent (red), high (orange), medium (blue), low (gray)';
COMMENT ON COLUMN tasks.status IS 'Status flow: pending -> assigned -> in_progress -> completed/cancelled';
COMMENT ON COLUMN tasks.payment_status IS 'Payment tracking: unpaid -> pending -> paid';