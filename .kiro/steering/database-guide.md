---
inclusion: fileMatch
fileMatchPattern: '**/db*|**/database*|**/models/*|**/migrations/*'
---

# Database Implementation Guide

## PostgreSQL Connection
```typescript
// Use standard PostgreSQL pool (NOT Neon serverless)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Row-Level Security (RLS)
```sql
-- Auth schema setup
CREATE SCHEMA IF NOT EXISTS auth;

-- Auth function for RLS
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'sub';
$$ LANGUAGE sql STABLE;

-- Example RLS policy
CREATE POLICY "Users can only see their own data"
  ON users FOR ALL
  USING (clerk_user_id = auth.user_id());
```

## Database Schema
```sql
-- Users table with Clerk integration
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('agency', 'partner')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Query Patterns
```typescript
// Standard PostgreSQL queries
const result = await pool.query(
  'SELECT * FROM users WHERE clerk_user_id = $1',
  [userId]
);

// Insert with RETURNING
const newUser = await pool.query(
  'INSERT INTO users (clerk_user_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
  [clerkUserId, email, name, role]
);
```