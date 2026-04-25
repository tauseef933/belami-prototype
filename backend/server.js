/**
 * Belami Try-On — Express API Server
 * ------------------------------------
 * Loads env vars first, then registers routes.
 */

import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path    from 'node:path';
import { fileURLToPath } from 'node:url';

import tryOnRouter    from './routes/tryOn.js';
import productsRouter from './routes/products.js';
import placementRouter from './routes/placement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Validate critical env vars on startup ──────────────────────────────────
const REQUIRED_ENV = ['GEMINI_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing required environment variables: ${missing.join(', ')}`);
  console.error(`    Copy .env.example → .env and fill in the values.\n`);
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logger (dev-friendly) ─────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok:         true,
    service:    'belami-tryon-backend',
    version:    '1.0.0',
    uptimeSec:  Math.round(process.uptime()),
    geminiReady: !!process.env.GEMINI_API_KEY,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/products',  productsRouter);
app.use('/api/placement', placementRouter);
app.use('/api/tryon',     tryOnRouter);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ ok: false, error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✅  Belami Try-On API ready`);
  console.log(`      http://localhost:${PORT}/api/health\n`);
});

export default app;