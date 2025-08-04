"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./db.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const clients_js_1 = __importDefault(require("./routes/clients.js"));
const tasks_js_1 = __importDefault(require("./routes/tasks.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize database on startup
(0, db_js_1.initializeDatabase)().catch(console.error);
// Routes
app.use('/api/auth', auth_js_1.default);
app.use('/api/clients', clients_js_1.default);
app.use('/api/tasks', tasks_js_1.default);
app.use('/api/notifications', notifications_js_1.default);
app.use('/api/dashboard', dashboard_js_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(port, () => {
    console.log(`Visa Manager Backend listening at http://localhost:${port}`);
    console.log('🔗 Neon Auth integration enabled');
    console.log('🗄️ PostgreSQL database via Neon connected');
});
//# sourceMappingURL=index.js.map