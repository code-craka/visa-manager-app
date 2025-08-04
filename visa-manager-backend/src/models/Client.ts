import pool from '../db.js';

const createClientTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      passport VARCHAR(255) NOT NULL,
      visaType VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log('Client table created successfully');
  } catch (error: any) {
    console.error('Error creating client table:', error);
  }
};

createClientTable();