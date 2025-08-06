-- Setup auth schema and functions for Neon + Clerk integration
-- Run this in your Neon database console

-- Create the auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on the auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anonymous;

-- Create the user_id function that extracts user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'https://hasura.io/jwt/claims')::json->>'x-hasura-user-id'
  )::text
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_id() TO anonymous;

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    (current_setting('request.jwt.claims', true)::json->>'https://hasura.io/jwt/claims')::json->>'x-hasura-default-role'
  )::text
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO anonymous;

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_id() IS NOT NULL
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.is_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_authenticated() TO anonymous;

-- Test the functions
SELECT 'Auth schema setup completed successfully!' as status;