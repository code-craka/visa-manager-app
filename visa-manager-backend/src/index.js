"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const clients_1 = __importDefault(require("./routes/clients"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/dashboard', dashboard_js_1.default);
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map