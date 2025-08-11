const { Pool } = require('pg');
require('dotenv').config();

async function testTaskService() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Testing task service functionality...');
    
    // Set up test user context
    await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', 'test_user_123']);
    
    // Test basic task creation
    const createTaskQuery = `
      INSERT INTO tasks (
        title, description, client_id, task_type, priority, 
        commission_amount, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const taskData = [
      'Test Task',
      'This is a test task description',
      1, // Assuming client ID 1 exists
      'document_review',
      'high',
      100.00,
      'test_user_123',
      'pending'
    ];
    
    console.log('Creating test task...');
    const result = await pool.query(createTaskQuery, taskData);
    
    if (result.rows.length > 0) {
      console.log('✅ Task created successfully:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      
      const taskId = result.rows[0].id;
      
      // Test task update
      console.log('\nUpdating task...');
      const updateResult = await pool.query(
        'UPDATE tasks SET status = $1, notes = $2 WHERE id = $3 RETURNING *',
        ['in_progress', 'Task is now in progress', taskId]
      );
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Task updated successfully');
      }
      
      // Clean up test data
      await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      console.log('✅ Test data cleaned up');
      
    } else {
      console.log('❌ Failed to create task');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testTaskService();