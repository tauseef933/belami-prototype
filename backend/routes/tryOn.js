/**
 * POST /api/tryon
 * ----------------
 * Accepts multipart (with a `room` file) OR JSON with `roomUrl`.
 * Fields: productSku (string), prompt (string)
 * Returns: { ok, room, product, overlay, prompt }
 */

import express  from 'express';
import multer   from 'multer';
import path     from 'node:path';
import fs       from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  optimizeRoomImage,
  toBase64DataUrl,
  safeDeleteFile,
  cleanupFolder,
} from '../utils/imageProcessor.js';
import { getProductBySku } from '../data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer setup ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file,  cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const router = express.Router();

// ── POST /api/tryon ───────────────────────────────────────────────────────
router.post('/', (req, res, next) => {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');

  if (isMultipart) {
    upload.single('room')(req, res, (err) => {
      if (err) return next(err);
      processTryOn(req, res, next);
    });
  } else {
    processTryOn(req, res, next);
  }
});

async function processTryOn(req, res, next) {
  let uploadedPath = null;
  try {
    const productSku = (req.body?.productSku || req.query?.productSku || '').toString().trim();
    const prompt     = (req.body?.prompt     || '').toString().trim();
    const roomUrl    = req.body?.roomUrl     || null;

    if (!productSku) {
      return res.status(400).json({ ok: false, error: 'Missing required field: productSku' });
    }

    const product = getProductBySku(productSku);
    if (!product) {
      return res.status(404).json({ ok: false, error: `Unknown productSku: ${productSku}` });
    }

    let optimized = null;
    if (req.file) {
      uploadedPath = req.file.path;
      optimized    = await optimizeRoomImage(uploadedPath);
    }

    const overlay = computeOverlay(product, optimized, prompt);

    return res.json({
      ok:      true,
      product: {
        sku:       product.sku,
        name:      product.name,
        category:  product.category,
        placement: product.placement,
        width:     product.width,
        height:    product.height,
        depth:     product.depth,
      },
      prompt,
      roomUrl,
      overlay,
      room: optimized
        ? {
            base64:    toBase64DataUrl(optimized),
            width:     optimized.width,
            height:    optimized.height,
            sizeBytes: optimized.sizeBytes,
          }
        : null,
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  } finally {
    // Always clean up temp file
    if (uploadedPath) safeDeleteFile(uploadedPath);
    cleanupFolder(UPLOAD_DIR);
  }
}

// ── Overlay computation ───────────────────────────────────────────────────
function computeOverlay(product, room, prompt = '') {
  const p         = prompt.toLowerCase();
  const placement = product.placement;

  let anchor = { x: 0.5, y: 0.5 };
  if (placement === 'ceiling')  anchor = { x: 0.5, y: 0.18 };
  else if (placement === 'wall')     anchor = { x: 0.5, y: 0.42 };
  else if (placement === 'floor')    anchor = { x: 0.5, y: 0.78 };
  else if (placement === 'tabletop') anchor = { x: 0.5, y: 0.62 };

  if (/\bleft\b/.test(p))  anchor.x = Math.max(0.18, anchor.x - 0.2);
  if (/\bright\b/.test(p)) anchor.x = Math.min(0.82, anchor.x + 0.2);

  // Assume 108" ceiling height
  const ppi  = room ? room.height / 108 : 10;
  const pxW  = product.width  * ppi;
  const pxH  = product.height * ppi;

  return {
    anchor,
    scale: {
      ppi,
      pxWidth:  Math.round(pxW),
      pxHeight: Math.round(pxH),
    },
    variations: [
      { id: 'daytime',    label: 'Daytime · Natural Light',  opacity: 0.92, blend: 'multiply' },
      { id: 'evening',    label: 'Evening · Warm Ambience',   opacity: 1.0,  glow: true       },
      { id: 'alt',        label: 'Alternate Position',        opacity: 0.9,  mirror: true      },
      { id: 'dimensions', label: 'Dimension Guide',           opacity: 0.88, dimensionOverlay: true },
    ],
  };
}

export default router;