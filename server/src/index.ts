/**
 * Daily Dairy Manager - Server Entry Point
 * 
 * Express server with Firebase integration for dairy business management.
 * Provides RESTful API endpoints for customers, deliveries, billing, and inventory.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';

// Validate required environment variables
const requiredEnvVars = ['PORT'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Middleware Configuration
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Health Check Endpoint
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api', routes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🥛 Daily Dairy Manager Server                            ║
║                                                            ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                            ║
║   API Endpoints:                                           ║
║   • Health: http://localhost:${PORT}/health                 ║
║   • API:    http://localhost:${PORT}/api                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
