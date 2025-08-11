const { Pool } = require('pg');
require('dotenv').config();

async function testTaskCreation() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Testing task creation with existing schema...');
    
    // First, let's create a test user in the users table
    console.log('Creating test user...');
    const userResult = await pool.query(`
      INSERT INTO users (clerk_user_id, email, name, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (clerk_user_id) DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role
      RETURNING *
    `, ['test-user-123', 'test@example.com', 'Test User', 'agency']);
    
    console.log('✅ Test user created/updated:', userResult.rows[0]);
    
    // Get the user ID
    const userId = userResult.rows[0].id;
    
    // Test basic task creation with integer IDs
    const createTaskQuery = `
      INSERT INTO tasks (
        title, description, client_id, task_type, priority, 
        commission_amount, created_by, assigned_to, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const taskData = [
      'Test Task - Document Review',
      'This is a test task for document review',
      1, // Client ID 1 exists
      'document_review',
      'high',
      100.00,
      userId, // Use the actual user ID
      null, // Not assigned yet
      'pending'
    ];
    
    console.log('\nCreating test task...');
    const taskResult = await pool.query(createTaskQuery, taskData);
    
    if (taskResult.rows.length > 0) {
      console.log('✅ Task created successfully:');
      const task = taskResult.rows[0];
      console.log(`- ID: ${task.id}`);
      console.log(`- Title: ${task.title}`);
      console.log(`- Type: ${task.task_type}`);
      console.log(`- Priority: ${task.priority}`);
      console.log(`- Status: ${task.status}`);
      console.log(`- Commission: $${task.commission_amount}`);
      
      const taskId = task.id;
      
      // Test task update
      console.log('\nUpdating task status...');
      const updateResult = await pool.query(
        'UPDATE tasks SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        ['in_progress', 'Task is now in progress', taskId]
      );
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Task updated successfully');
        console.log(`- New Status: ${updateResult.rows[0].status}`);
        console.log(`- Notes: ${updateResult.rows[0].notes}`);
      }
      
      // Test task query with joins
      console.log('\nTesting task query with client details...');
      const joinResult = await pool.query(`
        SELECT 
          t.*,
          c.name as client_name,
          c.email as client_email,
          u.name as created_by_name
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [taskId]);
      
      if (joinResult.rows.length > 0) {
        const taskWithDetails = joinResult.rows[0];
        console.log('✅ Task with details retrieved:');
        console.log(`- Task: ${taskWithDetails.title}`);
        console.log(`- Client: ${taskWithDetails.client_name} (${taskWithDetails.client_email})`);
        console.log(`- Created by: ${taskWithDetails.created_by_name}`);
      }
      
      // Clean up test data
      await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      console.log('\n✅ Test task cleaned up');
      
    } else {
      console.log('❌ Failed to create task');
    }
    
    console.log('\n🎉 Task system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testTaskCreation();