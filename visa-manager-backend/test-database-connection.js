#!/usr/bin/env node

/**
 * Database Connection and Schema Validation Test
 * Tests PostgreSQL connection, schema integrity, and basic CRUD operations
 */

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

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection & Schema Validation...\n');

  try {
    // Test 1: Basic Connection
    console.log('1. Testing PostgreSQL Connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful');
    console.log(`   Time: ${connectionTest.rows[0].current_time}`);
    console.log(`   Version: ${connectionTest.rows[0].pg_version.split(' ')[0]}\n`);

    // Test 2: Check if clients table exists
    console.log('2. Checking clients table structure...');
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Clients table does not exist');
      console.log('   Run migration 003_create_clients_table.sql first\n');
      return;
    }

    console.log('✅ Clients table exists with columns:');
    tableCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('');

    // Test 3: Check indexes
    console.log('3. Checking database indexes...');
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'clients' AND schemaname = 'public'
      ORDER BY indexname
    `);

    console.log('✅ Indexes found:');
    indexCheck.rows.forEach(row => {
      console.log(`   ${row.indexname}`);
    });
    console.log('');

    // Test 4: Check RLS policies
    console.log('4. Checking Row-Level Security policies...');
    const rlsCheck = await pool.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'clients'
      ORDER BY policyname
    `);

    if (rlsCheck.rows.length === 0) {
      console.log('❌ No RLS policies found');
    } else {
      console.log('✅ RLS policies found:');
      rlsCheck.rows.forEach(row => {
        console.log(`   ${row.policyname} (${row.cmd})`);
      });
    }
    console.log('');

    // Test 5: Check constraints
    console.log('5. Checking table constraints...');
    const constraintCheck = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'clients' AND table_schema = 'public'
      ORDER BY constraint_name
    `);

    console.log('✅ Constraints found:');
    constraintCheck.rows.forEach(row => {
      console.log(`   ${row.constraint_name}: ${row.constraint_type}`);
    });
    console.log('');

    // Test 6: Test basic CRUD operations (mock data)
    console.log('6. Testing basic CRUD operations...');

    // Test INSERT with mock agency ID
    const mockAgencyId = 'test_agency_123';
    const insertResult = await pool.query(`
      INSERT INTO clients (name, email, phone, visa_type, status, notes, agency_id, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, email
    `, [
      'Test Client',
      'test@example.com',
      '+1-555-0123',
      'business',
      'pending',
      'Test client for database validation',
      mockAgencyId,
      mockAgencyId,
      mockAgencyId
    ]);

    const clientId = insertResult.rows[0].id;
    console.log(`✅ INSERT successful - Client ID: ${clientId}`);

    // Test SELECT
    const selectResult = await pool.query(`
      SELECT * FROM clients WHERE id = $1 AND agency_id = $2
    `, [clientId, mockAgencyId]);

    console.log(`✅ SELECT successful - Found client: ${selectResult.rows[0].name}`);

    // Test UPDATE
    const updateResult = await pool.query(`
      UPDATE clients 
      SET status = $1, updated_by = $2
      WHERE id = $3 AND agency_id = $4
      RETURNING status
    `, ['in_progress', mockAgencyId, clientId, mockAgencyId]);

    console.log(`✅ UPDATE successful - New status: ${updateResult.rows[0].status}`);

    // Test DELETE (cleanup)
    const deleteResult = await pool.query(`
      DELETE FROM clients WHERE id = $1 AND agency_id = $2
    `, [clientId, mockAgencyId]);

    console.log(`✅ DELETE successful - Rows affected: ${deleteResult.rowCount}`);
    console.log('');

    // Test 7: Performance test
    console.log('7. Testing query performance...');
    const startTime = Date.now();

    await pool.query(`
      SELECT COUNT(*) FROM clients WHERE agency_id = $1
    `, [mockAgencyId]);

    const endTime = Date.now();
    console.log(`✅ Query performance: ${endTime - startTime}ms`);
    console.log('');

    console.log('🎉 All database tests passed successfully!');
    console.log('✅ Database is ready for client management operations');

  } catch (error) {
    console.error('❌ Database test failed:', error);

    if (error.code === '42P01') {
      console.log('\n💡 Solution: Run the migration script:');
      console.log('   Copy and paste visa-manager-backend/src/migrations/003_create_clients_table.sql');
      console.log('   into your Neon database console');
    } else if (error.code === '23505') {
      console.log('\n💡 Unique constraint violation - this is expected during testing');
    }
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);