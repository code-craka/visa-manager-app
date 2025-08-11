const { Pool } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Checking existing users...');
    
    // Check auth.users table
    const authUsersResult = await pool.query('SELECT * FROM auth.users LIMIT 5');
    console.log('\nauth.users table:');
    authUsersResult.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Clerk ID: ${row.clerk_user_id}, Email: ${row.email}, Role: ${row.role}`);
    });
    
    // Check public.users table if it exists
    try {
      const publicUsersResult = await pool.query('SELECT * FROM users LIMIT 5');
      console.log('\npublic.users table:');
      publicUsersResult.rows.forEach(row => {
        console.log(`- ID: ${row.id}, Clerk ID: ${row.clerk_user_id}, Email: ${row.email}, Role: ${row.role}`);
      });
    } catch (error) {
      console.log('\npublic.users table: Not accessible or empty');
    }
    
    // Check clients table
    const clientsResult = await pool.query('SELECT id, name, agency_id FROM clients LIMIT 3');
    console.log('\nclients table:');
    clientsResult.rows.forEach(row => {
      console.log(`- Client ID: ${row.id}, Name: ${row.name}, Agency ID: ${row.agency_id}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();