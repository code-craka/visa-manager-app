import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './db';
import { webSocketService } from './services/WebSocketService';
import BackendEnvironmentLoader from './services/EnvironmentLoader';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import taskRoutes from './routes/tasks';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import testRoutes from './routes/test';

// Load platform-specific environment configuration
BackendEnvironmentLoader.loadEnvironment();
const config = BackendEnvironmentLoader.getConfig();

const app = express();
const server = createServer(app);

// Platform-specific CORS configuration
const corsOptions = {
  origin: config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-Client-Version', 'X-Device-Type'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Platform detection middleware
app.use((req, res, next) => {
  const platform = req.headers['x-platform'] || 'unknown';
  const clientVersion = req.headers['x-client-version'] || 'unknown';
  
  // Add platform info to request for logging/analytics
  (req as any).platform = platform;
  (req as any).clientVersion = clientVersion;
  
  next();
});

// Initialize database on startup
initializeDatabase().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint with platform info
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: config.PLATFORM,
    environment: config.NODE_ENV,
    version: '0.3.2'
  });
});

// Initialize WebSocket service
webSocketService.initialize(server);

server.listen(config.PORT, config.HOST, () => {
  console.log(`🚀 Visa Manager Backend listening at http://${config.HOST}:${config.PORT}`);
  console.log(`📱 Platform: ${config.PLATFORM}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Clerk JWT integration enabled`);
  console.log(`🗄️ PostgreSQL database via Neon connected`);
  console.log(`🔌 WebSocket server ready on port ${config.WEBSOCKET_PORT}`);
  console.log(`🌐 CORS origins: ${config.CORS_ORIGIN}`);
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