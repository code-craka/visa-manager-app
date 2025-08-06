-- Migration: Convert from neon_user_id to clerk_user_id
-- Run this manually in your Neon database console

-- Step 1: Check if we need to migrate
DO $$
BEGIN
    -- Check if neon_user_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'neon_user_id'
    ) THEN
        -- Add clerk_user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'clerk_user_id'
        ) THEN
            ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(255);
        END IF;
        
        -- Copy data from neon_user_id to clerk_user_id (if needed)
        UPDATE users SET clerk_user_id = neon_user_id WHERE clerk_user_id IS NULL;
        
        -- Make clerk_user_id NOT NULL and UNIQUE
        ALTER TABLE users ALTER COLUMN clerk_user_id SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);
        
        -- Drop the old column and constraint
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_neon_user_id_key;
        ALTER TABLE users DROP COLUMN IF EXISTS neon_user_id;
        
        -- Update index
        DROP INDEX IF EXISTS idx_users_neon_id;
        CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
        
        RAISE NOTICE 'Migration completed: neon_user_id -> clerk_user_id';
    ELSE
        RAISE NOTICE 'No migration needed: clerk_user_id column already exists';
    END IF;
END $$;