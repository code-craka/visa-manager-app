"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// Create a new client
router.post('/', async (req, res) => {
    const { name, passport, visaType } = req.body;
    try {
        const newClient = await db_js_1.default.query('INSERT INTO clients (name, passport, visaType) VALUES ($1, $2, $3) RETURNING *', [name, passport, visaType]);
        res.json(newClient.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all clients
router.get('/', async (req, res) => {
    try {
        const allClients = await db_js_1.default.query('SELECT * FROM clients');
        res.json(allClients.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a single client
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const client = await db_js_1.default.query('SELECT * FROM clients WHERE id = $1', [id]);
        res.json(client.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a client
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, passport, visaType } = req.body;
    try {
        const updatedClient = await db_js_1.default.query('UPDATE clients SET name = $1, passport = $2, visaType = $3 WHERE id = $4 RETURNING *', [name, passport, visaType, id]);
        res.json(updatedClient.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a client
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_js_1.default.query('DELETE FROM clients WHERE id = $1', [id]);
        res.json({ message: 'Client deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=clients.js.map