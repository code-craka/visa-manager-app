"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("../db.js"));
const createTaskTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      client_id INT REFERENCES clients(id) ON DELETE CASCADE,
      assigned_to INT REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL,
      commission NUMERIC(10, 2) NOT NULL,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await db_js_1.default.query(query);
        console.log('Task table created successfully');
    }
    catch (error) {
        console.error('Error creating task table:', error);
    }
};
createTaskTable();
//# sourceMappingURL=Task.js.map