// Canvas compositing engine for Belami Virtual Try-On
// ------------------------------------------------------------------
// Three variations are produced from a single room + product pair:
//   1. Daytime    — natural lighting + soft shadow
//   2. Evening    — warm amber overlay on room, radial glow around product
//   3. Dimensions — product rendered with dimension guide lines
//
// Public API:
//   loadImage(src)               -> Promise<HTMLImageElement>
//   removeWhiteBackground(img)   -> HTMLCanvasElement (transparent bg)
//   composeVariation(opts)       -> { dataUrl, meta }
//   composeAllVariations(opts)   -> Promise<[{id,label,dataUrl,meta}, ...]>

import { scaleProductToImage, resolvePromptAnchor } from './dimensionCalc.js';
import { removeProductBackgroundHighRes } from './bgRemoval.js';

export const BRAND = {
  navy: '#1B3A5C',
  blue: '#2E86AB',
  gold: '#F18F01',
  cream: '#F5F7FA',
};

/**
 * Remove white / near-white background from a product image.
 * Returns an HTMLCanvasElement with transparent background pixels.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} img
 * @param {{ threshold?: number, softness?: number }} opts
 *   threshold – brightness value (0-255) above which a low-saturation pixel
 *               is considered background (default 228)
 *   softness  – feather range below threshold for anti-aliased edges (default 22)
 * @returns {HTMLCanvasElement}
 */
export function removeWhiteBackground(img, { threshold = 228, softness = 22 } = {}) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, W, H);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    // Saturation in HSV space (0 = gray/white, 1 = fully saturated)
    const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
    const brightness = (r + g + b) / 3;

    if (brightness >= threshold && sat < 0.13) {
      // Core background: fully transparent
      d[i + 3] = 0;
    } else if (brightness >= threshold - softness && sat < 0.22) {
      // Soft feather zone: partial transparency for anti-aliased edges
      const t = (brightness - (threshold - softness)) / softness;
      d[i + 3] = Math.round(d[i + 3] * (1 - t * t));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function loadImage(src, { timeoutMs = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('Missing image source'));
    const img = new Image();
    // Note: do NOT set crossOrigin for same-origin or data: URLs — it can
    // taint the canvas when the dev server does not echo CORS headers.
    img.decoding = 'async';
    let done = false;
    const to = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`Image load timed out: ${String(src).slice(0, 80)}`));
    }, timeoutMs);

    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(to);
      resolve(img);
    };
    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(to);
      reject(new Error(`Image failed to load: ${String(src).slice(0, 80)}`));
    };
    img.src = src;
  });
}

const MAX_OUTPUT_WIDTH = Number.POSITIVE_INFINITY;

function prepareCanvas(roomImg) {
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / roomImg.naturalWidth);
  const W = Math.round(roomImg.naturalWidth * scale);
  const H = Math.round(roomImg.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx, W, H };
}

function drawRoom(ctx, roomImg, W, H) {
  ctx.drawImage(roomImg, 0, 0, W, H);
}

/**
 * Compute placement rect for a product on a given room canvas.
 *
 * @param {object}      product
 * @param {{ width, height }} roomSize
 * @param {string}      prompt
 * @param {{ anchor?: {x,y} }|null} override
 * @param {{ w:number, h:number }|null} productImgSz
 *   Natural pixel size of the (bg-removed) product image.
 *   Used to preserve aspect ratio — pass whenever available.
 */
export function computePlacement(product, roomSize, prompt, override, productImgSz = null) {
  const { w, h, ppi, depth } = scaleProductToImage(
    product,
    roomSize,
    productImgSz,
    { scaleFactor: override?.scaleFactor }
  );
  const anchor        = override?.anchor || resolvePromptAnchor(product, prompt);
  const productAnchor = product.anchor  || { x: 0.5, y: 0.5 };

  // Top-left position so the product's own anchor point lands on the
  // chosen room-image anchor.
  const x = anchor.x * roomSize.width  - productAnchor.x * w;
  const y = anchor.y * roomSize.height - productAnchor.y * h;

  return { x, y, w, h, ppi, depth, anchor };
}

function drawProduct(ctx, productImg, rect, opts = {}) {
  const { opacity = 1, shadow = true, glow = false, blend = null } = opts;
  ctx.save();
  if (blend) ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = opacity;

  if (shadow) {
    ctx.shadowColor = 'rgba(15, 31, 51, 0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.shadowOffsetX = 0;
  }

  ctx.drawImage(productImg, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  if (glow) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const r = Math.max(rect.w, rect.h) * 0.85;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 205, 130, 0.55)');
    grad.addColorStop(0.45, 'rgba(255, 170, 80, 0.18)');
    grad.addColorStop(1, 'rgba(255, 170, 80, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function applyEveningOverlay(ctx, W, H) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(60, 35, 80, 0.55)');
  grad.addColorStop(0.5, 'rgba(90, 50, 60, 0.45)');
  grad.addColorStop(1, 'rgba(35, 25, 55, 0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const warm = ctx.createLinearGradient(0, 0, 0, H);
  warm.addColorStop(0, 'rgba(255, 190, 120, 0.25)');
  warm.addColorStop(1, 'rgba(255, 140, 80, 0.1)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawDimensionOverlay(ctx, product, rect) {
  const pad = 22;
  ctx.save();
  ctx.strokeStyle = BRAND.blue;
  ctx.fillStyle = BRAND.blue;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.font = '600 16px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'middle';

  // Bounding box
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.setLineDash([]);

  // Width dimension (below)
  const yB = rect.y + rect.h + pad;
  line(ctx, rect.x, yB, rect.x + rect.w, yB);
  tick(ctx, rect.x, yB);
  tick(ctx, rect.x + rect.w, yB);
  labelPill(ctx, rect.x + rect.w / 2, yB, `${product.width}"`);

  // Height dimension (right)
  const xR = rect.x + rect.w + pad;
  line(ctx, xR, rect.y, xR, rect.y + rect.h);
  tick(ctx, xR, rect.y, true);
  tick(ctx, xR, rect.y + rect.h, true);
  labelPill(ctx, xR, rect.y + rect.h / 2, `${product.height}"`);

  // Depth (if available) — diagonal label top-left
  if (product.depth) {
    labelPill(ctx, rect.x - pad * 0.2, rect.y - pad * 0.6, `D ${product.depth}"`, 'left');
  }
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function tick(ctx, x, y, vertical = false) {
  const s = 8;
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
  } else {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
  }
  ctx.stroke();
}
function labelPill(ctx, x, y, text, align = 'center') {
  ctx.save();
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  const metrics = ctx.measureText(text);
  const padX = 10;
  const padY = 6;
  const w = metrics.width + padX * 2;
  const h = 22;
  const bx = align === 'left' ? x : x - w / 2;
  const by = y - h / 2;
  const r = h / 2;
  ctx.fillStyle = BRAND.blue;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + w, by, bx + w, by + h, r);
  ctx.arcTo(bx + w, by + h, bx, by + h, r);
  ctx.arcTo(bx, by + h, bx, by, r);
  ctx.arcTo(bx, by, bx + w, by, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
  ctx.restore();
}

function drawWatermark(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6;
  ctx.fillText('BELAMI · Virtual Try-On', W - 14, H - 12);
  ctx.restore();
}

/**
 * Compose a single variation.
 * @param {object} p
 * @param {HTMLImageElement|HTMLCanvasElement} p.roomImg
 * @param {HTMLCanvasElement} p.productImg  - bg-removed product canvas
 * @param {object} p.product
 * @param {string} p.prompt
 * @param {'daytime'|'evening'|'dimensions'} p.variation
 * @param {{ anchor?: {x:number,y:number} }} [p.positionOverride]
 */
export function composeVariation({ roomImg, productImg, product, prompt, variation, positionOverride }) {
  const { canvas, ctx, W, H } = prepareCanvas(roomImg);
  drawRoom(ctx, roomImg, W, H);

  // Extract natural pixel dimensions from the (bg-removed) product canvas
  const productImgSz = {
    w: productImg.naturalWidth  || productImg.width  || 0,
    h: productImg.naturalHeight || productImg.height || 0,
  };

  const placement = computePlacement(product, { width: W, height: H }, prompt, positionOverride, productImgSz);

  if (variation === 'daytime') {
    drawProduct(ctx, productImg, placement, {
      opacity: 0.97,
      shadow: true,
    });
  } else if (variation === 'evening') {
    applyEveningOverlay(ctx, W, H);
    drawProduct(ctx, productImg, placement, {
      opacity: 1,
      shadow: true,
      glow: product.category === 'lighting' || product.category === 'fans',
    });
  } else if (variation === 'dimensions') {
    drawProduct(ctx, productImg, placement, {
      opacity: 0.95,
      shadow: true,
    });
    drawDimensionOverlay(ctx, product, placement);
  }

  drawWatermark(ctx, W, H);

  // Export as high-quality PNG at 2x pixel density using devicePixelRatio.
  const exportScale = Math.max(2, Math.min(4, (window.devicePixelRatio || 1) * 2));
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.round(W * exportScale);
  exportCanvas.height = Math.round(H * exportScale);
  const ex = exportCanvas.getContext('2d');
  ex.imageSmoothingEnabled = true;
  ex.imageSmoothingQuality = 'high';
  ex.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

  let dataUrl;
  try {
    dataUrl = exportCanvas.toDataURL('image/png');
  } catch (e) {
    console.warn('[canvasBlend] PNG export failed, retrying with base canvas', e);
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch (e2) {
      console.error('[canvasBlend] canvas is tainted; cannot export', e2);
      throw new Error(
        'Canvas export blocked by browser. Try re-uploading your room photo.'
      );
    }
  }

  return {
    dataUrl,
    meta: { variation, placement, canvasSize: { W, H } },
  };
}

export async function composeAllVariations({ roomSrc, productSrc, product, prompt, positionOverride }) {
  const [roomImg, productImgRaw] = await Promise.all([loadImage(roomSrc), loadImage(productSrc)]);

  let productImg;
  try {
    productImg = await removeProductBackgroundHighRes(productSrc);
  } catch (err) {
    console.warn('[tryOn] product preparation failed, falling back to local chroma removal', err);
    productImg = removeWhiteBackground(productImgRaw);
  }

  const variations = [
    { id: 'daytime', label: 'Daytime · Natural Light' },
    { id: 'evening', label: 'Evening · Warm Ambience' },
    { id: 'dimensions', label: 'Dimension Guide' },
  ];

  const out = [];
  for (const v of variations) {
    try {
      const result = composeVariation({ roomImg, productImg, product, prompt, variation: v.id, positionOverride });
      out.push({ ...v, ...result });
    } catch (e) {
      console.error(`[tryOn] variation "${v.id}" failed`, e);
      throw e;
    }
  }
  return out;
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'belami-tryon.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
