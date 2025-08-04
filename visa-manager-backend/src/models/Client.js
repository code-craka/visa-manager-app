"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("../db.js"));
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
        await db_js_1.default.query(query);
        console.log('Client table created successfully');
    }
    catch (error) {
        console.error('Error creating client table:', error);
    }
};
createClientTable();
//# sourceMappingURL=Client.js.map