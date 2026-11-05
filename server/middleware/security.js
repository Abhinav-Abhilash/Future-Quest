/**
 * Security Middleware Configuration
 * Future Quest 2026 - Server Backend
 *
 * Configures Helmet, CORS whitelist, and Express Rate Limiters.
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Parse allowed origins from environment variable (comma-separated)
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Fallback defaults for local development if not configured
if (allowedOrigins.length === 0) {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'https://future-quest-ten.vercel.app'
  );
}

/**
 * CORS Middleware configured with strict origin check
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server or curl in dev)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: Origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

/**
 * Helmet Security Headers Middleware
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Managed by frontend hosting when served separately
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * General API Rate Limiter
 * 150 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict Registration Rate Limiter
 * 10 registration attempts per 15 minutes per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many team registrations from this IP. Please try again later.',
  },
});

/**
 * Strict Answer Submission Rate Limiter
 * 30 checks per 5 minutes per IP to prevent brute-forcing
 */
export const answerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many answer submissions. Please wait a moment before trying again.',
  },
});

