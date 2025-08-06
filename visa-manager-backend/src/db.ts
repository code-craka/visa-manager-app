import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database via Neon');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // First, handle migration from neon_user_id to clerk_user_id
    console.log('Checking for database migration...');
    
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
      
      // Drop old column and constraint
      await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_neon_user_id_key`);
      await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS neon_user_id`);
      
      // Update index
      await pool.query(`DROP INDEX IF EXISTS idx_users_neon_id`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id)`);
      
      console.log('Migration completed successfully!');
    }

    // Users table with Clerk integration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'partner' CHECK (role IN ('agency', 'partner')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        passport VARCHAR(50) UNIQUE NOT NULL,
        visa_type VARCHAR(100) NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tasks table with commission tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_type VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        commission DECIMAL(10,2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
        due_date DATE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'task', 'payment', 'urgent')),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `);

    console.log('Database tables initialized successfully');
    console.log('Note: RLS policies will be set up manually in the database');

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
