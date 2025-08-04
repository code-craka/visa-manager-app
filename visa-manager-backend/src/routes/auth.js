"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// User registration
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await db_js_1.default.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *', [email, hashedPassword, role]);
        res.json(newUser.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db_js_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.rows[0].id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map