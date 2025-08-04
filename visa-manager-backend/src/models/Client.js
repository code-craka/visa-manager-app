"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientsWithTaskStats = exports.searchClients = exports.deleteClient = exports.updateClient = exports.getClientById = exports.getAllClients = exports.createClient = void 0;
const db_js_1 = __importDefault(require("../db.js"));
// Create a new client
const createClient = async (name, passport, visaType, createdBy) => {
    try {
        const result = await db_js_1.default.query(`INSERT INTO clients (name, passport, visa_type, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`, [name, passport, visaType, createdBy]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error creating client:', error);
        throw new Error('Failed to create client');
    }
};
exports.createClient = createClient;
// Get all clients with pagination
const getAllClients = async (page = 1, limit = 20, createdBy) => {
    try {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM clients';
        let countQuery = 'SELECT COUNT(*) FROM clients';
        let params = [];
        if (createdBy) {
            query += ' WHERE created_by = $1';
            countQuery += ' WHERE created_by = $1';
            params = [createdBy];
        }
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        const [clientsResult, countResult] = await Promise.all([
            db_js_1.default.query(query, [...params, limit, offset]),
            db_js_1.default.query(countQuery, params)
        ]);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        return {
            clients: clientsResult.rows,
            total,
            page,
            totalPages
        };
    }
    catch (error) {
        console.error('Error fetching clients:', error);
        throw new Error('Failed to fetch clients');
    }
};
exports.getAllClients = getAllClients;
// Get client by ID
const getClientById = async (id) => {
    try {
        const result = await db_js_1.default.query('SELECT * FROM clients WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching client by ID:', error);
        throw new Error('Failed to fetch client');
    }
};
exports.getClientById = getClientById;
// Update client
const updateClient = async (id, name, passport, visaType) => {
    try {
        const result = await db_js_1.default.query(`UPDATE clients 
       SET name = $2, passport = $3, visa_type = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`, [id, name, passport, visaType]);
        if (result.rows.length === 0) {
            throw new Error('Client not found');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Error updating client:', error);
        throw new Error('Failed to update client');
    }
};
exports.updateClient = updateClient;
// Delete client
const deleteClient = async (id) => {
    try {
        const result = await db_js_1.default.query('DELETE FROM clients WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    catch (error) {
        console.error('Error deleting client:', error);
        throw new Error('Failed to delete client');
    }
};
exports.deleteClient = deleteClient;
// Search clients by name or passport
const searchClients = async (searchTerm, createdBy) => {
    try {
        let query = `
      SELECT * FROM clients 
      WHERE (name ILIKE $1 OR passport ILIKE $1)
    `;
        let params = [`%${searchTerm}%`];
        if (createdBy) {
            query += ' AND created_by = $2';
            params.push(createdBy);
        }
        query += ' ORDER BY created_at DESC';
        const result = await db_js_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('Error searching clients:', error);
        throw new Error('Failed to search clients');
    }
};
exports.searchClients = searchClients;
// Get clients with their task counts
const getClientsWithTaskStats = async (createdBy) => {
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
        let params = [];
        if (createdBy) {
            query += ' WHERE c.created_by = $1';
            params = [createdBy];
        }
        query += ' GROUP BY c.id ORDER BY c.created_at DESC';
        const result = await db_js_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('Error fetching clients with task stats:', error);
        throw new Error('Failed to fetch clients with task statistics');
    }
};
exports.getClientsWithTaskStats = getClientsWithTaskStats;
//# sourceMappingURL=Client.js.map