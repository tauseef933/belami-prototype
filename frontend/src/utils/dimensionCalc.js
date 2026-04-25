// Dimension accuracy system
// ------------------------------------------------------------------
// Translates real-world product dimensions (inches) into on-screen pixel
// dimensions that look realistic in a typical room photo.
//
// Key design decisions:
//   1. We use the product IMAGE's natural aspect ratio (not the product's
//      real-world width/height ratio) to determine the display rectangle.
//      Product photos almost never match the exact W×H of the physical item,
//      so drawing at product.width × product.height would always distort.
//   2. We anchor scale on the product WIDTH (the dimension most visible in a
//      room photo), then derive height from the photo's pixel aspect ratio.
//   3. Hard caps per placement type prevent a 96" sofa from filling 80% of
//      the image — products should look "in scale" with the room.

export const REFERENCE = {
  CEILING_HEIGHT_IN: 108,   // standard 9ft ceiling
  VISIBLE_HEIGHT_IN: 96,    // typical camera framing (slightly below ceiling)
  DOOR_HEIGHT_IN: 80,
};

// ─── Size caps ────────────────────────────────────────────────────────────────
// Maximum fraction of the room image each placement type may occupy.
// Tuned so products look realistic without dominating the frame.
const SIZE_CAPS = {
  ceiling:  { wFrac: 0.34, hFrac: 0.28 },
  wall:     { wFrac: 0.48, hFrac: 0.52 },
  floor:    { wFrac: 0.68, hFrac: 0.60 },
  tabletop: { wFrac: 0.24, hFrac: 0.22 },
};

/**
 * Compute pixels-per-inch for a room image based on estimated visible height.
 */
export function computePPI(imageSize, framing = 'full-room') {
  const refInches =
    framing === 'full-room' ? REFERENCE.CEILING_HEIGHT_IN :
    framing === 'wide'      ? REFERENCE.VISIBLE_HEIGHT_IN :
                              REFERENCE.DOOR_HEIGHT_IN;
  return imageSize.height / refInches;
}

/**
 * Estimate room height in inches from image proportions using a standard door
 * heuristic (80 inches). This is a practical approximation for single-photo
 * placement when no depth map is available.
 */
export function estimateRoomHeightInInches(imageSize) {
  const aspect = imageSize.width / Math.max(1, imageSize.height);
  // wider shots usually capture more horizontal span and less full height;
  // this keeps estimates stable for common interiors.
  if (aspect > 1.9) return 120;  // ultra wide room framing
  if (aspect > 1.5) return 108;  // typical landscape full-room
  if (aspect > 1.2) return 96;   // moderately wide
  return 88;                     // portrait-ish framing
}

/**
 * Depth factor — mild perspective scale (0.55..1.05).
 */
export function depthFactor(distance = 0.5) {
  return 1.05 - Math.max(0, Math.min(1, distance)) * 0.5;
}

export function inferFraming(product) {
  if (product.placement === 'ceiling') return 'full-room';
  if (product.placement === 'wall')    return 'wide';
  return 'door-view';
}

export function inferDistance(product) {
  switch (product.placement) {
    case 'ceiling':  return 0.35;
    case 'wall':     return 0.45;
    case 'floor':    return 0.55;
    case 'tabletop': return 0.65;
    default:         return 0.5;
  }
}

/**
 * Scale a product for display in a room image.
 *
 * @param {object} product           - product data (width, height, placement…)
 * @param {{ width, height }} imgSz  - room canvas size in px
 * @param {{ w, h }|null} productImgSz
 *   Natural pixel dimensions of the product image (AFTER bg removal).
 *   When provided, height is derived from image aspect ratio rather than the
 *   product's real-world height — this prevents distortion because product
 *   photos rarely match the physical W×H ratio exactly.
 * @returns {{ w, h, ppi, depth }}
 */
export function scaleProductToImage(product, imgSz, productImgSz = null, opts = {}) {
  const estimatedRoomHeightIn = estimateRoomHeightInInches(imgSz);
  const ppiFromRoomHeight = imgSz.height / Math.max(1, estimatedRoomHeightIn);
  const ppiFromDoorRef = computePPI(imgSz, inferFraming(product));
  // Blend both heuristics to stabilize across viewpoints.
  const ppi = ppiFromRoomHeight * 0.7 + ppiFromDoorRef * 0.3;
  const depth  = depthFactor(inferDistance(product));
  const aiScale = Number.isFinite(opts.scaleFactor) ? opts.scaleFactor : 1;

  // Width drives the scale; height is derived from the photo's pixel ratio
  let w = product.width * ppi * depth * aiScale;

  let h;
  if (productImgSz && productImgSz.w > 0 && productImgSz.h > 0) {
    // Use the image's own aspect ratio — no distortion
    h = w * (productImgSz.h / productImgSz.w);
  } else {
    // Fall back to real-world height
    h = product.height * ppi * depth;
  }

  // Apply size caps — products must not dominate the room frame
  const { wFrac = 0.35, hFrac = 0.38 } = SIZE_CAPS[product.placement] || {};
  const maxW = imgSz.width  * wFrac;
  const maxH = imgSz.height * hFrac;

  const scaleFactor = Math.min(1, maxW / w, maxH / h);
  w = Math.round(w * scaleFactor);
  h = Math.round(h * scaleFactor);

  return { w, h, ppi, depth };
}

/**
 * Resolve the room-image anchor (normalized 0..1) from the prompt text.
 * The anchor is where the product's OWN anchor point will land in the room.
 */
export function resolvePromptAnchor(product, prompt = '') {
  const p         = prompt.toLowerCase();
  const placement = product.placement;
  let x = 0.5;
  let y = 0.5;

  if (placement === 'ceiling') {
    y = 0.12;  // high up — hanging from ceiling
    if (/left/.test(p))  x = 0.32;
    else if (/right/.test(p)) x = 0.68;
  } else if (placement === 'wall') {
    y = 0.38;
    if (/above|over|bed|headboard|mantle/.test(p)) y = 0.30;
    if (/eye\s*level/.test(p))  y = 0.42;
    if (/high/.test(p))         y = 0.22;
    if (/below/.test(p))        y = 0.54;
    if (/left/.test(p))        x = 0.22;
    else if (/right/.test(p)) x = 0.78;
  } else if (placement === 'floor') {
    y = 0.72;
    if (/left/.test(p))              x = 0.28;
    else if (/right/.test(p))       x = 0.72;
    if (/back\s*wall|against/.test(p)) y = 0.68;
    if (/corner/.test(p)) {
      y = 0.72;
      if (!(/left|right/.test(p))) x = 0.18;
    }
  } else if (placement === 'tabletop') {
    y = 0.60;
    if (/left/.test(p))       x = 0.36;
    else if (/right/.test(p)) x = 0.64;
    if (/dining|center/.test(p)) { x = 0.5; y = 0.58; }
  }

  return { x, y };
}

export function formatDims(product) {
  const parts = [product.width, product.height];
  if (product.depth) parts.push(product.depth);
  return parts.map((v) => `${v}"`).join(' × ');
}
