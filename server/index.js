/**
 * Future Quest 2026 - Backend Server Entrypoint
 * Node.js + Express + MongoDB Atlas
 *
 * Phase 1: Server and Database Foundation
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, closeDB, getDb } from './db/connection.js';
import { ensureIndexes } from './db/indexes.js';
import {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
} from './middleware/security.js';

// Resolve directory path & load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Core security & parsing middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' })); // Restrict payload size
app.use(cookieParser());

// 2. Global rate limiter for API routes
app.use('/api', generalLimiter);

// 3. Health & diagnostics endpoint (Server clock source of truth)
app.get('/api/health', async (req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    res.status(200).json({
      status: 'ok',
      service: 'Future Quest 2026 API',
      serverTime: Date.now(),
      serverIso: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'Future Quest 2026 API',
      serverTime: Date.now(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// 4. Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 5. Global error handling middleware
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

let server = null;

/**
 * Start the server and connect to MongoDB Atlas
 */
export async function startServer() {
  try {
    const db = await connectDB();
    await ensureIndexes(db);

    server = app.listen(PORT, () => {
      console.log(`[SERVER] Future Quest 2026 backend running on port ${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    });

    return { app, server, db };
  } catch (error) {
    console.error('[SERVER] Startup failed:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function handleShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(() => {
      console.log('[SERVER] HTTP server closed.');
    });
  }

  try {
    await closeDB();
    console.log('[SERVER] Graceful shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('[SERVER] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Auto-start when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
