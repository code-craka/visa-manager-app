"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: 'postgresql://neondb_owner:npg_a2YDL1iWJdEO@ep-little-violet-a1hmcag3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});
exports.default = pool;
//# sourceMappingURL=db.js.map