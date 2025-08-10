-- Migration: Create audit logging tables for partner access controls
-- Version: 004_create_audit_tables.sql
-- Requirements: 6.5 - Add audit logging for unauthorized access attempts

BEGIN;

-- Create audit_logs table for general audit logging
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('agency', 'partner', 'admin')),
  action VARCHAR(100) NOT NULL, -- e.g., 'client_view', 'client_list', 'client_create'
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('client', 'task', 'user', 'system')),
  resource_id INTEGER, -- ID of the resource being accessed
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- Additional context data
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_events table for security-specific events
CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('agency', 'partner', 'admin')),
  event_type VARCHAR(100) NOT NULL, -- e.g., 'unauthorized_access', 'suspicious_activity'
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('client', 'task', 'user', 'system')),
  resource_id INTEGER,
  severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_resource ON security_events(resource_type, resource_id);

-- Create composite indexes for common queries
CREATE INDEX idx_audit_logs_user_resource ON audit_logs(user_id, resource_type, timestamp);
CREATE INDEX idx_security_events_severity_time ON security_events(severity, timestamp);

-- Enable Row-Level Security for audit tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit_logs - users can only see their own logs, admins see all
CREATE POLICY audit_logs_user_access ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR 
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- RLS policy for security_events - only admins can access
CREATE POLICY security_events_admin_access ON security_events
  FOR ALL
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin');

-- Insert policy for audit logs - system can insert, users cannot directly insert
CREATE POLICY audit_logs_system_insert ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system to insert audit logs

CREATE POLICY security_events_system_insert ON security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system to insert security events

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT INSERT ON security_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE security_events_id_seq TO authenticated;

-- Create function to automatically clean old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- Delete low-severity security events older than 6 months
  DELETE FROM security_events 
  WHERE timestamp < NOW() - INTERVAL '6 months' 
  AND severity = 'low';
  
  -- Keep medium/high/critical security events for 2 years
  DELETE FROM security_events 
  WHERE timestamp < NOW() - INTERVAL '2 years' 
  AND severity IN ('medium', 'high', 'critical');
END;
$$ LANGUAGE plpgsql;

-- Create a view for partner access summary (for monitoring)
CREATE OR REPLACE VIEW partner_access_summary AS
SELECT 
  user_id,
  DATE(timestamp) as access_date,
  COUNT(*) as total_accesses,
  COUNT(*) FILTER (WHERE success = true) as successful_accesses,
  COUNT(*) FILTER (WHERE success = false) as failed_accesses,
  COUNT(DISTINCT resource_id) as unique_clients_accessed,
  COUNT(*) FILTER (WHERE action = 'client_view') as client_views,
  COUNT(*) FILTER (WHERE action = 'client_list') as client_lists
FROM audit_logs
WHERE user_role = 'partner'
AND resource_type = 'client'
AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(timestamp)
ORDER BY access_date DESC, user_id;

-- Grant access to the view
GRANT SELECT ON partner_access_summary TO authenticated;

COMMIT;