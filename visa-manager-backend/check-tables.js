const { Pool } = require('pg');
require('dotenv').config();

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Checking existing tables...');
    
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('tasks', 'clients', 'users')
      ORDER BY table_name, ordinal_position;
    `);
    
    console.log('Existing tables and columns:');
    result.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();