-- Migration: Optimize clients table performance with additional indexes and query optimizations
-- Version: 005_optimize_clients_performance_fixed.sql

-- Add composite indexes for common query patterns (without CONCURRENTLY in transaction)
CREATE INDEX IF NOT EXISTS idx_clients_agency_status ON clients(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_agency_visa_type ON clients(agency_id, visa_type);
CREATE INDEX IF NOT EXISTS idx_clients_agency_created_at ON clients(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_agency_name ON clients(agency_id, name);

-- Add partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_clients_pending ON clients(agency_id, created_at DESC) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_clients_in_progress ON clients(agency_id, created_at DESC) 
  WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_clients_completed ON clients(agency_id, created_at DESC) 
  WHERE status = 'completed';

-- Add index for sorting by multiple columns
CREATE INDEX IF NOT EXISTS idx_clients_agency_sort ON clients(agency_id, name, created_at DESC);

-- Create materialized view for client statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS client_stats_mv AS
SELECT 
  agency_id,
  COUNT(*) as total_clients,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'documents_required' THEN 1 END) as documents_required,
  COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  MAX(updated_at) as last_updated
FROM clients
GROUP BY agency_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_stats_mv_agency ON client_stats_mv(agency_id);

-- Create function to refresh client stats materialized view
CREATE OR REPLACE FUNCTION refresh_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW client_stats_mv;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh stats when clients are modified
DROP TRIGGER IF EXISTS trigger_refresh_client_stats ON clients;
CREATE TRIGGER trigger_refresh_client_stats
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_client_stats();

-- Create function for optimized client search
CREATE OR REPLACE FUNCTION search_clients(
  p_agency_id VARCHAR(255),
  p_search_term TEXT DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL,
  p_visa_type VARCHAR(50) DEFAULT NULL,
  p_sort_by VARCHAR(20) DEFAULT 'created_at',
  p_sort_order VARCHAR(4) DEFAULT 'DESC',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id INTEGER,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  visa_type VARCHAR(50),
  status VARCHAR(50),
  notes TEXT,
  agency_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.email, c.phone, c.visa_type, c.status, c.notes,
         c.agency_id, c.created_at, c.updated_at, c.created_by, c.updated_by
  FROM clients c
  WHERE c.agency_id = p_agency_id
    AND (p_search_term IS NULL OR 
         c.name ILIKE '%' || p_search_term || '%' OR 
         c.email ILIKE '%' || p_search_term || '%')
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_visa_type IS NULL OR c.visa_type = p_visa_type)
  ORDER BY 
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'ASC' THEN c.name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' THEN c.name END DESC,
    CASE WHEN p_sort_by = 'visa_type' AND p_sort_order = 'ASC' THEN c.visa_type END ASC,
    CASE WHEN p_sort_by = 'visa_type' AND p_sort_order = 'DESC' THEN c.visa_type END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN c.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN c.created_at END DESC,
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function for optimized client count
CREATE OR REPLACE FUNCTION count_clients(
  p_agency_id VARCHAR(255),
  p_search_term TEXT DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL,
  p_visa_type VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM clients c
    WHERE c.agency_id = p_agency_id
      AND (p_search_term IS NULL OR 
           c.name ILIKE '%' || p_search_term || '%' OR 
           c.email ILIKE '%' || p_search_term || '%')
      AND (p_status IS NULL OR c.status = p_status)
      AND (p_visa_type IS NULL OR c.visa_type = p_visa_type)
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get client statistics from materialized view
CREATE OR REPLACE FUNCTION get_client_stats(p_agency_id VARCHAR(255))
RETURNS TABLE(
  total_clients BIGINT,
  pending BIGINT,
  in_progress BIGINT,
  documents_required BIGINT,
  under_review BIGINT,
  approved BIGINT,
  rejected BIGINT,
  completed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cs.total_clients, 0),
    COALESCE(cs.pending, 0),
    COALESCE(cs.in_progress, 0),
    COALESCE(cs.documents_required, 0),
    COALESCE(cs.under_review, 0),
    COALESCE(cs.approved, 0),
    COALESCE(cs.rejected, 0),
    COALESCE(cs.completed, 0)
  FROM client_stats_mv cs
  WHERE cs.agency_id = p_agency_id
  UNION ALL
  SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT
  WHERE NOT EXISTS (SELECT 1 FROM client_stats_mv WHERE agency_id = p_agency_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW client_stats_mv;

-- Add table statistics for query planner optimization
ANALYZE clients;