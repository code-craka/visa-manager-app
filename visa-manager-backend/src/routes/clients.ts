import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Create a new client
router.post('/', async (req, res) => {
  const { name, passport, visaType } = req.body;
  try {
    const newClient = await pool.query(
      'INSERT INTO clients (name, passport, visaType) VALUES ($1, $2, $3) RETURNING *',
      [name, passport, visaType]
    );
    res.json(newClient.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clients
router.get('/', async (req, res) => {
  try {
    const allClients = await pool.query('SELECT * FROM clients');
    res.json(allClients.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single client
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    res.json(client.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a client
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, passport, visaType } = req.body;
  try {
    const updatedClient = await pool.query(
      'UPDATE clients SET name = $1, passport = $2, visaType = $3 WHERE id = $4 RETURNING *',
      [name, passport, visaType, id]
    );
    res.json(updatedClient.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a client
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;