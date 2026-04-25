import sharp        from 'sharp';
import { promises as fs } from 'node:fs';
import path               from 'node:path';

const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY  = 85;

/**
 * Optimize an uploaded room photo:
 *   - Auto-rotate via EXIF orientation
 *   - Resize so longest edge ≤ 1600px
 *   - Re-encode as JPEG @ 85% quality (mozjpeg)
 *
 * @returns {{ buffer, width, height, format, sizeBytes }}
 */
export async function optimizeRoomImage(inputPath) {
  const meta = await sharp(inputPath).rotate().metadata();

  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  const scale    = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const targetW  = Math.round((meta.width || MAX_LONG_EDGE) * scale);

  const out = await sharp(inputPath)
    .rotate()
    .resize({ width: targetW, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer:    out.data,
    width:     out.info.width,
    height:    out.info.height,
    format:    out.info.format,
    sizeBytes: out.info.size,
  };
}

/**
 * Convert an optimized image buffer into a base64 data URL.
 */
export function toBase64DataUrl({ buffer, format = 'jpeg' }) {
  return `data:image/${format};base64,${buffer.toString('base64')}`;
}

/**
 * Silently delete a file — ignores "file not found" errors.
 */
export async function safeDeleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[cleanup] Could not delete file:', err.message);
  }
}

/**
 * Delete files in a folder that are older than `olderThanMs` milliseconds.
 * Default: 15 minutes.
 */
export async function cleanupFolder(folder, olderThanMs = 15 * 60 * 1000) {
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const cutoff  = Date.now() - olderThanMs;

    await Promise.allSettled(
      entries
        .filter(e => e.isFile())
        .map(async e => {
          const full = path.join(folder, e.name);
          const stat = await fs.stat(full).catch(() => null);
          if (stat && stat.mtimeMs < cutoff) await fs.unlink(full).catch(() => null);
        })
    );
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[cleanup-folder]', err.message);
  }
}