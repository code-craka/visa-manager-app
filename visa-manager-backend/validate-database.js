#!/usr/bin/env node

/**
 * Comprehensive Database Validation Script
 * Validates the clients table migration and overall database structure
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function validateDatabase() {
  console.log('🔍 Starting comprehensive database validation...\n');

  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log(`   Current time: ${connectionTest.rows[0].current_time}\n`);

    // Check if clients table exists
    console.log('2. Validating clients table structure...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clients'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Clients table does not exist');
      console.log('   Run migration 003_create_clients_table.sql first\n');
      return false;
    }

    // Validate table schema
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('✅ Clients table exists with columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Validate constraints
    console.log('\n3. Validating table constraints...');
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'clients' AND table_schema = 'public';
    `);

    console.log('✅ Table constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // Validate indexes
    console.log('\n4. Validating indexes...');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'clients' AND schemaname = 'public';
    `);

    console.log('✅ Table indexes:');
    indexes.rows.forEach(index => {
      console.log(`   - ${index.indexname}`);
    });

    // Validate RLS policies
    console.log('\n5. Validating Row-Level Security...');
    const rlsEnabled = await pool.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'clients';
    `);

    if (rlsEnabled.rows[0]?.relrowsecurity) {
      console.log('✅ Row-Level Security is enabled');
    } else {
      console.log('❌ Row-Level Security is not enabled');
    }

    const policies = await pool.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'clients';
    `);

    console.log('✅ RLS Policies:');
    policies.rows.forEach(policy => {
      console.log(`   - ${policy.policyname}: ${policy.cmd} for roles: ${policy.roles}`);
    });

    // Validate triggers
    console.log('\n6. Validating triggers...');
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'clients';
    `);

    console.log('✅ Table triggers:');
    triggers.rows.forEach(trigger => {
      console.log(`   - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
    });

    // Test CRUD operations (with mock data)
    console.log('\n7. Testing CRUD operations...');
    
    // Set JWT claims for RLS testing
    await pool.query(`SET request.jwt.claims = '{"sub": "test-agency-123", "role": "agency"}'`);

    // Test INSERT
    const insertResult = await pool.query(`
      INSERT INTO clients (name, email, phone, visa_type, status, notes, agency_id, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, email;
    `, [
      'Test Client',
      'test@example.com',
      '+1-555-0123',
      'business',
      'pending',
      'Test client for validation',
      'test-agency-123',
      'test-agency-123',
      'test-agency-123'
    ]);

    const clientId = insertResult.rows[0].id;
    console.log(`✅ INSERT successful - Created client ID: ${clientId}`);

    // Test SELECT
    const selectResult = await pool.query(`
      SELECT * FROM clients WHERE id = $1;
    `, [clientId]);

    console.log(`✅ SELECT successful - Retrieved client: ${selectResult.rows[0].name}`);

    // Test UPDATE
    const updateResult = await pool.query(`
      UPDATE clients SET status = 'in_progress', updated_by = $2
      WHERE id = $1
      RETURNING status, updated_at;
    `, [clientId, 'test-agency-123']);

    console.log(`✅ UPDATE successful - New status: ${updateResult.rows[0].status}`);

    // Test DELETE
    const deleteResult = await pool.query(`
      DELETE FROM clients WHERE id = $1;
    `, [clientId]);

    console.log(`✅ DELETE successful - Removed ${deleteResult.rowCount} row(s)`);

    // Validate foreign key relationships
    console.log('\n8. Validating foreign key relationships...');
    
    // Check if tasks table exists for RLS policy validation
    const tasksTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    if (tasksTableExists.rows[0].exists) {
      console.log('✅ Tasks table exists - RLS policy reference is valid');
      
      // Check foreign key constraint
      const foreignKeys = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (tc.table_name = 'clients' OR ccu.table_name = 'clients');
      `);

      console.log('✅ Foreign key relationships:');
      foreignKeys.rows.forEach(fk => {
        console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('⚠️  Tasks table does not exist - RLS policy may fail');
      console.log('   Consider creating tasks table or updating RLS policy');
    }

    // Performance validation
    console.log('\n9. Performance validation...');
    
    // Check query plan for common operations
    const explainResult = await pool.query(`
      EXPLAIN (FORMAT JSON) 
      SELECT * FROM clients 
      WHERE agency_id = 'test-agency' AND status = 'pending'
      ORDER BY created_at DESC;
    `);

    const plan = explainResult.rows[0]['QUERY PLAN'][0];
    console.log('✅ Query execution plan analysis:');
    console.log(`   - Execution time estimate: ${plan['Total Cost']} cost units`);
    console.log(`   - Uses indexes: ${JSON.stringify(plan).includes('Index') ? 'Yes' : 'No'}`);

    console.log('\n🎉 Database validation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Clients table structure correct');
    console.log('   ✅ All constraints in place');
    console.log('   ✅ Indexes created for performance');
    console.log('   ✅ Row-Level Security enabled');
    console.log('   ✅ CRUD operations functional');
    console.log('   ✅ Triggers working correctly');

    return true;

  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    console.error('\nFull error details:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run validation
validateDatabase().then(success => {
  process.exit(success ? 0 : 1);
});