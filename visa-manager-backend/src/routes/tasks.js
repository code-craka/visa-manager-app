"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// Create a new task
router.post('/', async (req, res) => {
    const { client_id, assigned_to, status, commission, payment_status } = req.body;
    try {
        const newTask = await db_js_1.default.query('INSERT INTO tasks (client_id, assigned_to, status, commission, payment_status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [client_id, assigned_to, status, commission, payment_status || 'pending']);
        res.json(newTask.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all tasks
router.get('/', async (req, res) => {
    try {
        const allTasks = await db_js_1.default.query('SELECT * FROM tasks');
        res.json(allTasks.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a single task
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await db_js_1.default.query('SELECT * FROM tasks WHERE id = $1', [id]);
        res.json(task.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a task
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { client_id, assigned_to, status, commission, payment_status } = req.body;
    try {
        const updatedTask = await db_js_1.default.query('UPDATE tasks SET client_id = $1, assigned_to = $2, status = $3, commission = $4, payment_status = $5 WHERE id = $6 RETURNING *', [client_id, assigned_to, status, commission, payment_status, id]);
        res.json(updatedTask.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a task
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_js_1.default.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map