import { Router, Request, Response } from 'express';
import pool from '../db';
import { verifyNeonAuth } from '../middleware/auth';
import { getUserByNeonId, getDatabaseUserIdByNeonId } from '../models/User.js';

const router = Router();

// Create a new client (agency only)
router.post('/', verifyNeonAuth, async (req: Request, res: Response) => {
  try {
    const { name, passport, visaType, email, phone } = req.body;
    const currentUser = req.user!;

    // Check if user is agency
    const user = await getUserByNeonId(currentUser.id);
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can create clients' });
    }

    const newClient = await pool.query(
      'INSERT INTO clients (name, passport, visa_type, email, phone, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, passport, visaType, email, phone, user.id]
    );
    res.json(newClient.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clients
router.get('/', verifyNeonAuth, async (req, res) => {
  try {
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = 'SELECT * FROM clients';
    let params: any[] = [];

    // If user is a partner, only show clients with tasks assigned to them
    if (user.role === 'partner') {
      query = `
        SELECT DISTINCT c.* FROM clients c 
        INNER JOIN tasks t ON c.id = t.client_id 
        WHERE t.assigned_to = $1
      `;
      params = [dbUserId];
    }

    const allClients = await pool.query(query, params);
    res.json(allClients.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single client
router.get('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const dbUserId = await getDatabaseUserIdByNeonId(currentUser.id);
    const user = await getUserByNeonId(currentUser.id);

    if (!user || !dbUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = 'SELECT * FROM clients WHERE id = $1';
    let params = [id];

    // If user is a partner, ensure they have access to this client
    if (user.role === 'partner') {
      query = `
        SELECT DISTINCT c.* FROM clients c 
        INNER JOIN tasks t ON c.id = t.client_id 
        WHERE c.id = $1 AND t.assigned_to = $2
      `;
      params = [id, dbUserId?.toString() || ''];
    }

    const client = await pool.query(query, params);

    if (client.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or access denied' });
    }

    res.json(client.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a client (agency only)
router.put('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, passport, visaType, email, phone } = req.body;
    const currentUser = req.user!;

    // Check if user is agency
    const user = await getUserByNeonId(currentUser.id);
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can update clients' });
    }

    const updatedClient = await pool.query(
      'UPDATE clients SET name = $1, passport = $2, visa_type = $3, email = $4, phone = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, passport, visaType, email, phone, id]
    );

    if (updatedClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(updatedClient.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a client (agency only)
router.delete('/:id', verifyNeonAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Check if user is agency
    const user = await getUserByNeonId(currentUser.id);
    if (!user || user.role !== 'agency') {
      return res.status(403).json({ error: 'Only agencies can delete clients' });
    }

    const deletedClient = await pool.query(
      'DELETE FROM clients WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully', client: deletedClient.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;