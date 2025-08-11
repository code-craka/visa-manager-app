const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Checking database schema...');
    
    // Check all schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    
    console.log('\nAvailable schemas:');
    schemasResult.rows.forEach(row => {
      console.log(`- ${row.schema_name}`);
    });
    
    // Check all tables in public schema
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nTables in public schema:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check users table structure
    const usersResult = await pool.query('SELECT * FROM users LIMIT 3');
    console.log('\nSample users:');
    usersResult.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Clerk ID: ${row.clerk_user_id}, Email: ${row.email}, Role: ${row.role}`);
    });
    
    // Check clients table
    const clientsResult = await pool.query('SELECT id, name, agency_id FROM clients LIMIT 3');
    console.log('\nSample clients:');
    clientsResult.rows.forEach(row => {
      console.log(`- Client ID: ${row.id}, Name: ${row.name}, Agency ID: ${row.agency_id}`);
    });
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();