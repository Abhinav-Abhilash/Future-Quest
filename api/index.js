/**
 * Future Quest 2026 - Vercel Serverless Function Entrypoint
 * Bridges incoming requests to the Express application
 */

import app, { initDbMiddleware } from '../server/index.js';

export default async function handler(req, res) {
  // Ensure DB connection / resilient in-memory store is ready before routing
  if (initDbMiddleware) {
    await new Promise((resolve) => initDbMiddleware(req, res, resolve));
  }
  return app(req, res);
}

