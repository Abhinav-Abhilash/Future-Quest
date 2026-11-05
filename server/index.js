/**
 * Future Quest 2026 - Backend Server Entrypoint
 * Node.js + Express + MongoDB Atlas (with Resilient In-Memory Fallback)
 *
 * Phase 2: API Routes Foundation
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

// Route imports
import authRoutes from './routes/auth.js';
import stateRoutes from './routes/state.js';
import puzzleRoutes from './routes/puzzle.js';
import vaultRoutes from './routes/vault.js';
import devRoutes from './routes/dev.js';

// Resolve directory path & load environment
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} catch (_e) {}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (Vercel, AWS, Cloudflare)
app.set('trust proxy', 1);

// Middleware to ensure DB is initialized before route handling
export async function initDbMiddleware(req, res, next) {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[SERVER] connectDB warning in middleware:', err.message);
  }
  if (next) next();
}

// 1. Core security & parsing middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' })); // Restrict payload size
app.use(cookieParser());
app.use(initDbMiddleware);

// 2. Global rate limiter for API routes
app.use('/api', generalLimiter);

// 3. Health & diagnostics endpoint (Server clock source of truth)
const healthHandler = async (req, res) => {
  try {
    const database = getDb();
    await database.command({ ping: 1 });

    res.status(200).json({
      status: 'ok',
      service: 'Future Quest 2026 API',
      serverTime: Date.now(),
      serverIso: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: database.isInMemory ? 'in-memory' : 'connected',
    });
  } catch (error) {
    res.status(200).json({
      status: 'ok',
      service: 'Future Quest 2026 API',
      serverTime: Date.now(),
      serverIso: new Date().toISOString(),
      database: 'fallback',
      warning: error.message,
    });
  }
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// 4. API Routes (mounted on both /api and / for serverless flexibility)
const routers = [
  authRoutes,
  stateRoutes,
  puzzleRoutes,
  vaultRoutes,
  devRoutes,
];

for (const router of routers) {
  app.use('/api', router);
  app.use('/', router);
}

// 5. Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 6. Global error handling middleware
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
