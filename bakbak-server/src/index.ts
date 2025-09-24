import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import configuration and services
import { initializeDatabase } from './config/database';
import { SocketService } from './services/socketService';
import { setIO } from './services/io';

// Import routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import keyRoutes from './routes/keys';
import stickerRoutes from './routes/stickers';
import summarizeRoutes from './routes/summarize';
import { setupSummaryWorker } from './services/summaryWorker';
import locationRoutes from './routes/location';
import appsRoutes from './routes/apps';
import extensionsRoutes from './routes/extensions';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const PORT = process.env.PORT || 5000;

// Initialize database connection
initializeDatabase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/stickers', express.static(path.join(__dirname, '../uploads/stickers')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/extensions', extensionsRoutes);

// Health check endpoints
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Bak Bak Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Initialize Socket.IO service (instantiated for side effects)
new SocketService(io);
setIO(io);
setupSummaryWorker();

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Bak Bak Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});
