import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms
};

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('🗄️ PostgreSQL database via Neon connected');
});

pool.on('error', (err: any) => {
  console.error('❌ Database connection error:', err);
  // Gracefully handle connection errors without crashing
  if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    console.log('🔄 Retrying database connection...');
  }
});

// Initialize database tables
export const initializeDatabase = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      console.log('Checking for database migration...');

      // Test connection first
      await pool.query('SELECT 1');

      // Check if users table exists and what columns it has
      const tableCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
      `);

      const columns = tableCheck.rows.map(row => row.column_name);
      const hasNeonUserId = columns.includes('neon_user_id');
      const hasClerkUserId = columns.includes('clerk_user_id');

      if (hasNeonUserId && !hasClerkUserId) {
        console.log('Migrating from neon_user_id to clerk_user_id...');

        // Add clerk_user_id column
        await pool.query(`ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(255)`);

        // Copy data (you'll need to manually update these with actual Clerk user IDs)
        await pool.query(`UPDATE users SET clerk_user_id = neon_user_id WHERE clerk_user_id IS NULL`);

        // Make it NOT NULL and UNIQUE
        await pool.query(`ALTER TABLE users ALTER COLUMN clerk_user_id SET NOT NULL`);
        await pool.query(`ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id)`);

        // Drop the old column (optional - uncomment when ready)
        // await pool.query(`ALTER TABLE users DROP COLUMN neon_user_id`);

        console.log('✅ Migration completed successfully');
      }

      return; // Success, exit the retry loop

    } catch (error: any) {
      console.error('Error initializing database:', error);
      retries--;

      if (retries === 0) {
        console.error('❌ Failed to initialize database after 3 attempts');
        // Don't throw error to prevent server crash
        return;
      }

      console.log(`🔄 Retrying database initialization... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
    }
  }
};

export default pool;
