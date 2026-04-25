/**
 * GET /api/products
 * -----------------
 * Reads products.xlsx from backend/data/ and returns products
 * whose image file exists in frontend/public/products/.
 *
 * GET /api/products/images
 * Returns the list of image files currently in public/products/.
 */

import express from 'express';
import XLSX    from 'xlsx';
import path    from 'node:path';
import fs      from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();

const EXCEL_PATH = path.join(__dirname, '../data/products.xlsx');
const IMAGES_DIR = path.join(__dirname, '../../frontend/public/products');

// Default anchor positions per placement type
const DEFAULT_ANCHOR = {
  ceiling:  { x: 0.5, y: 0.05 },
  wall:     { x: 0.5, y: 0.5  },
  floor:    { x: 0.5, y: 0.95 },
  tabletop: { x: 0.5, y: 0.95 },
};

const DEFAULT_DIMENSIONS = {
  ceiling:  { width: 36, height: 18 },
  wall:     { width: 30, height: 36 },
  floor:    { width: 72, height: 34 },
  tabletop: { width: 14, height: 18 },
};

function getAvailableImages() {
  try {
    return new Set(fs.readdirSync(IMAGES_DIR).map(f => f.toLowerCase()));
  } catch {
    return new Set();
  }
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return val;
    }
  }
  return fallback;
}

function toNumber(value, fallback = 0) {
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCategory(value = '') {
  const raw = String(value).toLowerCase().trim();
  if (!raw)                                                        return 'decor';
  if (raw.includes('light'))                                       return 'lighting';
  if (raw.includes('fan'))                                         return 'fans';
  if (['furn','chair','sofa','cabinet','table'].some(k => raw.includes(k))) return 'furniture';
  if (['decor','art','mirror','sculpt'].some(k => raw.includes(k))) return 'decor';
  return raw;
}

function normalizePlacement(value = '', category = '') {
  const raw = String(value).toLowerCase().trim();
  if (['ceiling','wall','floor','tabletop'].includes(raw)) return raw;
  if (category === 'lighting' || category === 'fans')      return 'ceiling';
  if (category === 'furniture')                            return 'floor';
  return 'wall';
}

function normalizeRooms(value = '') {
  const roomMap = {
    living_room: 'living',
    dining_room: 'dining',
    bed_room:    'bedroom',
    bedroom:     'bedroom',
    family_room: 'living',
  };
  return String(value)
    .split(',')
    .map(r => r.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(Boolean)
    .map(r => roomMap[r] || r);
}

function rowToProduct(row, availableImages) {
  const sku = String(pick(row, ['SKU', 'Sku'])).trim();
  if (!sku) return null;

  // Resolve image path
  let image = null;
  const explicitFile = String(pick(row, ['ImageFile', 'Image Filename', 'Image', 'Filename'])).trim();
  const remoteUrl    = String(pick(row, ['ImageURL',  'Image URL',      'Image Link'])).trim();

  if (explicitFile && availableImages.has(explicitFile.toLowerCase())) {
    image = `/products/${explicitFile}`;
  } else {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      if (availableImages.has(`${sku.toLowerCase()}${ext}`)) {
        image = `/products/${sku}${ext}`;
        break;
      }
    }
  }

  if (!image && remoteUrl) image = remoteUrl;
  if (!image) return null; // skip products without images

  const category  = normalizeCategory(pick(row, ['Category', 'Product Category']));
  const placement = normalizePlacement(pick(row, ['Placement', 'Mounting', 'Product Placement']), category);
  const defAnchor = DEFAULT_ANCHOR[placement]    || { x: 0.5, y: 0.5 };
  const defDims   = DEFAULT_DIMENSIONS[placement] || { width: 24, height: 24 };

  const width =
    toNumber(pick(row, ['Width','Width (in)','Width (inch)','Width Inches']), 0) ||
    toNumber(pick(row, ['Blade Span','Blade Span (in)','Blade Span (inch)']), 0) ||
    defDims.width;

  const height =
    toNumber(pick(row, ['Height','Height (in)','Height (inch)','Height Inches']), 0) ||
    defDims.height;

  const depth = toNumber(pick(row, ['Depth','Depth (in)','Depth (inch)','Depth Inches']), 0);
  const rooms = normalizeRooms(pick(row, ['Rooms','Room Type','Room Types'], 'living'));

  const product = {
    sku,
    name:      String(pick(row, ['Name', 'Product Name'], sku)).trim(),
    category,
    width,
    height,
    unit:      'inches',
    placement,
    image,
    anchor: {
      x: toNumber(pick(row, ['AnchorX']), defAnchor.x),
      y: toNumber(pick(row, ['AnchorY']), defAnchor.y),
    },
    rooms,
  };

  // Optional fields — only include if non-empty
  const optional = {
    subType:  pick(row, ['SubType','Sub-Type','Subtype']),
    style:    pick(row, ['Style']),
    price:    pick(row, ['Price']),
    finish:   pick(row, ['Finish','Finish / Color','Color']),
    material: pick(row, ['Material']),
    tagline:  pick(row, ['Tagline']),
  };

  for (const [key, val] of Object.entries(optional)) {
    const str = String(val).trim();
    if (str) product[key] = key === 'subType' ? str.toLowerCase() : str;
  }

  if (depth) product.depth = depth;

  return product;
}

// ── GET /api/products ──────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  if (!fs.existsSync(EXCEL_PATH)) {
    return res.json({
      ok:       true,
      products: [],
      total:    0,
      message:  'No products.xlsx found. Place it in backend/data/products.xlsx',
    });
  }

  try {
    const wb       = XLSX.readFile(EXCEL_PATH);
    const sheet    = wb.Sheets[wb.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const images   = getAvailableImages();
    const products = rows.map(r => rowToProduct(r, images)).filter(Boolean);

    return res.json({ ok: true, products, total: products.length });
  } catch (err) {
    console.error('[products] Excel read error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to read products.xlsx — check file format.' });
  }
});

// ── GET /api/products/images ───────────────────────────────────────────────
router.get('/images', (_req, res) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort();
    return res.json({ ok: true, images: files, count: files.length });
  } catch {
    return res.json({ ok: true, images: [], count: 0 });
  }
});

export default router;