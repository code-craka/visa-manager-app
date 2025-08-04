import pool from '../db.js';

export interface Client {
  id: number;
  name: string;
  passport: string;
  visa_type: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Create a new client
export const createClient = async (
  name: string,
  passport: string,
  visaType: string,
  createdBy: number
): Promise<Client> => {
  try {
    const result = await pool.query(
      `INSERT INTO clients (name, passport, visa_type, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, passport, visaType, createdBy]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
  }
};

// Get all clients with pagination
export const getAllClients = async (
  page: number = 1,
  limit: number = 20,
  createdBy?: number
): Promise<{ clients: Client[]; total: number; page: number; totalPages: number }> => {
  try {
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM clients';
    let countQuery = 'SELECT COUNT(*) FROM clients';
    let params: any[] = [];

    if (createdBy) {
      query += ' WHERE created_by = $1';
      countQuery += ' WHERE created_by = $1';
      params = [createdBy];
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [clientsResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      clients: clientsResult.rows,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
};

// Get client by ID
export const getClientById = async (id: number): Promise<Client | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching client by ID:', error);
    throw new Error('Failed to fetch client');
  }
};

// Update client
export const updateClient = async (
  id: number,
  name: string,
  passport: string,
  visaType: string
): Promise<Client> => {
  try {
    const result = await pool.query(
      `UPDATE clients 
       SET name = $2, passport = $3, visa_type = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, name, passport, visaType]
    );

    if (result.rows.length === 0) {
      throw new Error('Client not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }
};

// Delete client
export const deleteClient = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client');
  }
};

// Search clients by name or passport
export const searchClients = async (
  searchTerm: string,
  createdBy?: number
): Promise<Client[]> => {
  try {
    let query = `
      SELECT * FROM clients 
      WHERE (name ILIKE $1 OR passport ILIKE $1)
    `;
    let params: any[] = [`%${searchTerm}%`];

    if (createdBy) {
      query += ' AND created_by = $2';
      params.push(createdBy);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw new Error('Failed to search clients');
  }
};

// Get clients with their task counts
export const getClientsWithTaskStats = async (createdBy?: number): Promise<any[]> => {
  try {
    let query = `
      SELECT 
        c.*,
        COUNT(t.id) as total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
        COALESCE(SUM(t.commission) FILTER (WHERE t.status = 'completed'), 0) as total_commission
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id
    `;

    let params: any[] = [];

    if (createdBy) {
      query += ' WHERE c.created_by = $1';
      params = [createdBy];
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching clients with task stats:', error);
    throw new Error('Failed to fetch clients with task statistics');
  }
};
