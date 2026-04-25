/**
 * seed-excel.js
 * -------------
 * Creates / regenerates backend/data/products.xlsx.
 *
 * Run once (from the project root):
 *   node backend/scripts/seed-excel.js
 *
 * Fill in any "TODO" rows in the generated file, then re-run to refresh.
 */

import XLSX from 'xlsx';
import path from 'node:path';
import fs   from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../../frontend/public/products');
const OUT_DIR    = path.join(__dirname, '../data');
const OUT_PATH   = path.join(OUT_DIR, 'products.xlsx');

// ── Ensure output directory exists ────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Known product data ─────────────────────────────────────────────────────
const KNOWN = [
  {
    SKU:       '147-BEL-2279195',
    Name:      'Hayley Common 6-Light Chandelier',
    Category:  'lighting',
    SubType:   'chandelier',
    Width:     24,
    Height:    24,
    Depth:     '',
    Placement: 'ceiling',
    Style:     'Traditional / Bohemian',
    Price:     '$489',
    Finish:    'Distressed Black with Antique White Beads',
    Material:  '',
    Tagline:   'A statement chandelier with layered beading for warm, ambient glow.',
    ImageFile: '147-BEL-2279195.jpg',
    ImageURL:  '',
    Rooms:     'dining,living,foyer',
    AnchorX:   0.5,
    AnchorY:   0.05,
  },
  {
    SKU:       '208-BEL-3383246',
    Name:      'Kitchener Pines Dorado Horse Sculpture',
    Category:  'decor',
    SubType:   'sculpture',
    Width:     14,
    Height:    16.5,
    Depth:     5.125,
    Placement: 'tabletop',
    Style:     'Transitional / Farmhouse',
    Price:     '$215',
    Finish:    'Aged Silver w/ Gold Accents on Black Iron Stand',
    Material:  'Polyresin · Iron Stand',
    Tagline:   'Hand-finished horse sculpture in aged silver with gilded accents.',
    ImageFile: '208-BEL-3383246.jpg',
    ImageURL:  '',
    Rooms:     'living,dining,office',
    AnchorX:   0.5,
    AnchorY:   0.95,
  },
  // ── Add more products here ─────────────────────────────────────────────
];

// ── Auto-detect images that have no known entry yet ────────────────────────
function getUnknownImages(knownSkus) {
  try {
    return fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .filter(f => !knownSkus.has(f.replace(/\.(jpe?g|png|webp)$/i, '')));
  } catch {
    return [];
  }
}

const knownSkus     = new Set(KNOWN.map(r => r.SKU));
const unknownImages = getUnknownImages(knownSkus);

const placeholders = unknownImages.map(file => ({
  SKU:       file.replace(/\.(jpe?g|png|webp)$/i, ''),
  Name:      `TODO — fill in product name`,
  Category:  'decor',
  SubType:   '',
  Width:     12,
  Height:    12,
  Depth:     '',
  Placement: 'floor',
  Style:     '',
  Price:     '',
  Finish:    '',
  Material:  '',
  Tagline:   '',
  ImageFile: file,
  ImageURL:  '',
  Rooms:     'living',
  AnchorX:   0.5,
  AnchorY:   0.5,
}));

const allRows = [...KNOWN, ...placeholders];

// ── Build worksheet ────────────────────────────────────────────────────────
const HEADERS = [
  'SKU','Name','Category','SubType',
  'Width','Height','Depth',
  'Placement','Style','Price','Finish','Material','Tagline',
  'ImageFile','ImageURL','Rooms','AnchorX','AnchorY',
];

const ws = XLSX.utils.json_to_sheet(allRows, { header: HEADERS });

ws['!cols'] = [
  { wch: 22 }, // SKU
  { wch: 40 }, // Name
  { wch: 12 }, // Category
  { wch: 16 }, // SubType
  { wch: 8  }, // Width
  { wch: 8  }, // Height
  { wch: 8  }, // Depth
  { wch: 12 }, // Placement
  { wch: 24 }, // Style
  { wch: 10 }, // Price
  { wch: 30 }, // Finish
  { wch: 20 }, // Material
  { wch: 50 }, // Tagline
  { wch: 24 }, // ImageFile
  { wch: 50 }, // ImageURL
  { wch: 24 }, // Rooms
  { wch: 8  }, // AnchorX
  { wch: 8  }, // AnchorY
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Products');
XLSX.writeFile(wb, OUT_PATH);

console.log(`\n✅  products.xlsx written → ${OUT_PATH}`);
console.log(`   ${KNOWN.length} known product(s)  |  ${placeholders.length} placeholder(s)\n`);
if (placeholders.length) {
  console.log('📝  Open the file and fill in the TODO rows:');
  placeholders.forEach(p => console.log(`    • ${p.SKU}  (${p.ImageFile})`));
  console.log();
}