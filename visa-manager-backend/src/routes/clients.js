"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const User_js_1 = require("../models/User.js");
const router = (0, express_1.Router)();
// Create a new client (agency only)
router.post('/', auth_1.verifyNeonAuth, async (req, res) => {
    try {
        const { name, passport, visaType, email, phone } = req.body;
        const currentUser = req.user;
        // Check if user is agency
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Only agencies can create clients' });
        }
        const newClient = await db_1.default.query('INSERT INTO clients (name, passport, visa_type, email, phone, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, passport, visaType, email, phone, user.id]);
        res.json(newClient.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all clients
router.get('/', auth_1.verifyNeonAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const dbUserId = await (0, User_js_1.getDatabaseUserIdByNeonId)(currentUser.id);
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || !dbUserId) {
            return res.status(404).json({ error: 'User not found' });
        }
        let query = 'SELECT * FROM clients';
        let params = [];
        // If user is a partner, only show clients with tasks assigned to them
        if (user.role === 'partner') {
            query = `
        SELECT DISTINCT c.* FROM clients c 
        INNER JOIN tasks t ON c.id = t.client_id 
        WHERE t.assigned_to = $1
      `;
            params = [dbUserId];
        }
        const allClients = await db_1.default.query(query, params);
        res.json(allClients.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a single client
router.get('/:id', auth_1.verifyNeonAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const dbUserId = await (0, User_js_1.getDatabaseUserIdByNeonId)(currentUser.id);
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
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
        const client = await db_1.default.query(query, params);
        if (client.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or access denied' });
        }
        res.json(client.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a client (agency only)
router.put('/:id', auth_1.verifyNeonAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, passport, visaType, email, phone } = req.body;
        const currentUser = req.user;
        // Check if user is agency
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Only agencies can update clients' });
        }
        const updatedClient = await db_1.default.query('UPDATE clients SET name = $1, passport = $2, visa_type = $3, email = $4, phone = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *', [name, passport, visaType, email, phone, id]);
        if (updatedClient.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(updatedClient.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a client (agency only)
router.delete('/:id', auth_1.verifyNeonAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        // Check if user is agency
        const user = await (0, User_js_1.getUserByNeonId)(currentUser.id);
        if (!user || user.role !== 'agency') {
            return res.status(403).json({ error: 'Only agencies can delete clients' });
        }
        const deletedClient = await db_1.default.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
        if (deletedClient.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ message: 'Client deleted successfully', client: deletedClient.rows[0] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=clients.js.map