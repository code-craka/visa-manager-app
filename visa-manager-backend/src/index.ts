import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './db.js';
import { webSocketService } from './services/WebSocketService.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import testRoutes from './routes/test.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize WebSocket service
webSocketService.initialize(server);

server.listen(port, () => {
  console.log(`Visa Manager Backend listening at http://localhost:${port}`);
  console.log('🔗 Clerk JWT integration enabled');
  console.log('🗄️ PostgreSQL database via Neon connected');
  console.log('🔌 WebSocket server ready for real-time updates');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});