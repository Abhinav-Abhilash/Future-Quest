/**
 * Future Quest 2026 - Centralized API Client
 *
 * Implements one unified fetch wrapper with:
 * - credentials: "include" (cookies transmitted automatically)
 * - JSON serialization & deserialization
 * - 12-second AbortController timeout
 * - Typed error hierarchy (OfflineError, UnauthorizedError, RateLimitError, ServerError, ApiError)
 * - Dynamic server-clock drift offset calculation
 */

import { CONFIG } from './config.js';

// --- Error Classes ---

export class OfflineError extends Error {
  constructor(message = 'Network unavailable. Please check your internet connection.') {
    super(message);
    this.name = 'OfflineError';
    this.isOffline = true;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired or invalid. Please re-register to continue.') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests. Please wait a few moments before trying again.') {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
  }
}

export class ServerError extends Error {
  constructor(message = 'Server encountered an unexpected error. Please retry.') {
    super(message);
    this.name = 'ServerError';
    this.status = 500;
  }
}

export class ApiError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// --- Server Time Drift Offset ---
let serverTimeOffsetMs = 0;
let hasSyncedServerTime = false;

/**
 * Updates clock offset based on server's true time.
 * @param {number} serverTimestampMs
 */
export function recordServerTime(serverTimestampMs) {
  if (typeof serverTimestampMs === 'number' && !isNaN(serverTimestampMs)) {
    serverTimeOffsetMs = serverTimestampMs - Date.now();
    hasSyncedServerTime = true;
  }
}

/**
 * Returns current time adjusted to server's clock.
 * Protected against device clock drift or local tampering.
 * @returns {number}
 */
export function getServerNow() {
  return Date.now() + serverTimeOffsetMs;
}

export function isServerTimeSynced() {
  return hasSyncedServerTime;
}

// --- Unified Fetch Client ---

/**
 * Perform an authenticated HTTP request to the backend API.
 * @param {string} endpoint - API path (e.g. '/state' or '/puzzle/puzzle_1/check')
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>} Parsed response data
 */
export async function fetchApi(endpoint, options = {}) {
  // Check online status first
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new OfflineError();
  }

  const baseUrl = (CONFIG.API_BASE_URL || '/api').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const timeoutMs = options.timeoutMs || 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // transmits fq_session cookie
    signal: controller.signal,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new OfflineError('Request timed out. The server took too long to respond.');
    }
    // Network or DNS failure
    throw new OfflineError('Cannot reach contest server. Check your connection or verify server is running.');
  } finally {
    clearTimeout(timeoutId);
  }

  // Parse server timestamp from date header or json
  const dateHeader = response.headers.get('date');
  if (dateHeader) {
    const parsedDate = Date.parse(dateHeader);
    if (!isNaN(parsedDate)) {
      recordServerTime(parsedDate);
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
      if (data && typeof data.serverTime === 'number') {
        recordServerTime(data.serverTime);
      }
    } catch (_parseErr) {
      data = null;
    }
  }

  // Check HTTP response status codes
  if (response.ok) {
    return data;
  }

  const errorMessage = data?.error || data?.message || response.statusText || 'Request failed';

  if (response.status === 401) {
    throw new UnauthorizedError(errorMessage);
  }
  if (response.status === 429) {
    throw new RateLimitError(errorMessage);
  }
  if (response.status >= 500) {
    throw new ServerError(errorMessage);
  }

  throw new ApiError(errorMessage, response.status, data);
}

// --- Exported API Action Helpers ---

export const Api = {
  /** Register a new team */
  register: (payload) => fetchApi('/register', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get complete contest state */
  getState: () => fetchApi('/state', { method: 'GET' }),

  /** Open a puzzle tile (starts timer, returns data) */
  openPuzzle: (id) => fetchApi(`/puzzle/${id}/open`, { method: 'POST' }),

  /** Pause a puzzle timer */
  leavePuzzle: (id) => fetchApi(`/puzzle/${id}/leave`, { method: 'POST' }),

  /** Validate puzzle answer check */
  checkAnswer: (id, payload) => fetchApi(`/puzzle/${id}/check`, {
    method: 'POST',
    body: JSON.stringify(typeof payload === 'object' ? payload : { answer: payload }),
  }),

  /** Request hint for puzzle */
  useHint: (id) => fetchApi(`/puzzle/${id}/hint`, { method: 'POST' }),

  /** Enter vault & freeze master timer */
  enterVault: () => fetchApi('/vault/enter', { method: 'POST' }),

  /** Record final contest submission */
  submit: (payload) => fetchApi('/submit', { method: 'POST', body: JSON.stringify(payload) }),

  /** DEV-ONLY: Reset all contest progress */
  devReset: (adminToken, options = {}) => fetchApi('/dev/reset', {
    method: 'POST',
    headers: adminToken ? { 'x-admin-token': adminToken } : {},
    body: JSON.stringify({ adminToken, ...options }),
  }),

  /** Clock synchronization */
  getServerNow,
  recordServerTime,
};

export default Api;
