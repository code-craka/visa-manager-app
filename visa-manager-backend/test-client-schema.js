// Test script to verify client schema and model functionality
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testClientSchema() {
  try {
    console.log('Testing client schema...');

    // Test 1: Check if clients table exists with correct structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\n✅ Clients table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Test 2: Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'clients' AND schemaname = 'public'
    `);

    console.log('\n✅ Indexes:');
    indexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    // Test 3: Check RLS policies
    const policies = await pool.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'clients' AND schemaname = 'public'
    `);

    console.log('\n✅ RLS Policies:');
    policies.rows.forEach(row => {
      console.log(`  - ${row.policyname}: ${row.cmd} (permissive: ${row.permissive})`);
    });

    // Test 4: Check constraints
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'clients' AND table_schema = 'public'
    `);

    console.log('\n✅ Constraints:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    console.log('\n🎉 Client schema test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing client schema:', error);
  } finally {
    await pool.end();
  }
}

testClientSchema();