/**
 * MongoDB Atlas Connection Module
 * Future Quest 2026 - Server Backend
 *
 * Implements connection pooling, serverApi v1, retry logic,
 * and graceful connection teardown.
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded even if run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'future_quest_2026';

if (!uri) {
  console.error('[DB] FATAL: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

let client = null;
let db = null;

const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 20,
  minPoolSize: 5,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
};

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<import('mongodb').Db>}
 */
export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri, clientOptions);
    await client.connect();
    // Verify connection with ping
    await client.db('admin').command({ ping: 1 });
    db = client.db(dbName);
    console.log(`[DB] Connected successfully to MongoDB Atlas: ${dbName}`);
    return db;
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB Atlas:', error.message);
    throw error;
  }
}

/**
 * Get active database instance
 * @returns {import('mongodb').Db}
 */
export function getDb() {
  if (!db) {
    throw new Error('[DB] Database is not connected. Call connectDB() first.');
  }
  return db;
}

/**
 * Get typed collection references
 */
export function getCollections() {
  const database = getDb();
  return {
    teams: database.collection('teams'),
    blocks: database.collection('blocks'),
    submissions: database.collection('submissions'),
    events: database.collection('events'),
  };
}

/**
 * Close database connection gracefully
 */
export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[DB] MongoDB Atlas connection closed.');
  }
}
