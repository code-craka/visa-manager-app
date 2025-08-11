const { Pool } = require('pg');
require('dotenv').config();

async function runSimpleTaskMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Running simple task table migration...');
    
    // Add missing columns one by one
    const migrations = [
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255)",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 0.00",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT",
      
      // Update existing columns
      "ALTER TABLE tasks ALTER COLUMN assigned_to TYPE VARCHAR(255)",
      "ALTER TABLE tasks ALTER COLUMN created_by TYPE VARCHAR(255)",
      
      // Update existing data
      "UPDATE tasks SET title = COALESCE(title, 'Task for ' || task_type) WHERE title IS NULL OR title = ''",
      
      // Create indexes
      "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title)",
      
      // Enable RLS
      "ALTER TABLE tasks ENABLE ROW LEVEL SECURITY"
    ];
    
    for (const migration of migrations) {
      try {
        console.log(`Executing: ${migration}`);
        await pool.query(migration);
        console.log('✅ Success');
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message}`);
      }
    }
    
    console.log('\n✅ Task table migration completed');
    
    // Verify the updated structure
    console.log('\nVerifying updated task table structure...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated task table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runSimpleTaskMigration();