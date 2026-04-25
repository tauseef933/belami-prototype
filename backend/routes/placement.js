/**
 * POST /api/placement
 * -------------------
 * Calls Gemini Vision with automatic model fallback + retry on 503/429.
 *
 * Model priority order (all free-tier, April 2026):
 *   1. GEMINI_MODEL env var  (your explicit choice)
 *   2. gemini-2.5-flash      (fast, free, recommended)
 *   3. gemini-2.5-flash-lite (lighter, more available)
 *   4. gemini-2.5-pro        (slowest free option, last resort)
 *
 * Body (JSON):
 *   roomBase64   — base64 image (data-URL prefix is stripped automatically)
 *   roomMimeType — default "image/jpeg"
 *   product      — { name, width?, height?, depth?, placement? }
 */

import express from 'express';

const router     = express.Router();
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Model fallback chain (all free-tier as of April 2026) ─────────────────
// If GEMINI_MODEL is set in .env, it goes first; rest are fallbacks.
function buildModelList() {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const defaults  = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
  ];
  if (preferred && !defaults.includes(preferred)) {
    return [preferred, ...defaults];          // custom model first, then fallbacks
  }
  if (preferred) {
    // Move the preferred one to the front
    return [preferred, ...defaults.filter(m => m !== preferred)];
  }
  return defaults;
}

const MODEL_LIST = buildModelList();

// ── Statuses that are worth retrying on the next model ────────────────────
const RETRYABLE = new Set([429, 500, 503]);

// ── Single Gemini call ────────────────────────────────────────────────────
async function callGemini(model, apiKey, payload) {
  const url  = `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  return resp;
}

// ── Build the request payload (same for all models) ───────────────────────
function buildPayload(pureBase64, roomMimeType, product) {
  const dims = [
    product.width  ? `${product.width}" wide`  : null,
    product.height ? `${product.height}" tall`  : null,
    product.depth  ? `${product.depth}" deep`   : null,
  ].filter(Boolean).join(', ');

  const placementType = product.placement || 'floor';

  const prompt = [
    `You are an expert interior designer with a precise eye for furniture and decor placement.`,
    ``,
    `Analyze this room photo carefully. The user wants to place a "${product.name}"`,
    dims ? `(dimensions: ${dims})` : '',
    `which typically goes on the ${placementType}.`,
    ``,
    `Identify the most natural and aesthetically pleasing position for this item in the room.`,
    `Consider: existing furniture, focal points, lighting, room proportions, and visual balance.`,
    ``,
    `Return ONLY a valid JSON object — no markdown fences, no extra text:`,
    `{`,
    `  "suggestion": "<one concise sentence describing where to place it>",`,
    `  "x_percent": <number 0-100, horizontal position left to right>,`,
    `  "y_percent": <number 0-100, vertical position top to bottom>,`,
    `  "scale_factor": <number 0.5-1.5, relative visual size>,`,
    `  "reasoning": "<two to three sentences explaining your choice>"`,
    `}`,
  ].filter(s => s !== null).join('\n');

  return {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: roomMimeType, data: pureBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature:     0.2,
      maxOutputTokens: 512,
    },
  };
}

// ── Parse and sanitize Gemini JSON output ─────────────────────────────────
function parseGeminiText(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  const data = JSON.parse(cleaned); // throws on invalid JSON

  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  data.x_percent    = clamp(data.x_percent,    0,   100);
  data.y_percent    = clamp(data.y_percent,    0,   100);
  data.scale_factor = clamp(data.scale_factor, 0.5, 1.5);
  if (typeof data.suggestion !== 'string') data.suggestion = '';
  if (typeof data.reasoning  !== 'string') data.reasoning  = '';

  return data;
}

// ── Small delay helper for retries ────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main route ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: 'GEMINI_API_KEY is not set. Add it to your backend/.env file.',
    });
  }

  const { roomBase64, roomMimeType = 'image/jpeg', product } = req.body || {};

  if (!roomBase64) {
    return res.status(400).json({ ok: false, error: 'roomBase64 is required.' });
  }
  if (!product?.name) {
    return res.status(400).json({ ok: false, error: 'product.name is required.' });
  }

  const pureBase64 = roomBase64.replace(/^data:[^;]+;base64,/, '');
  const payload    = buildPayload(pureBase64, roomMimeType, product);

  // ── Try each model in order until one succeeds ────────────────────────
  let lastError = 'All Gemini models failed. Please try again in a moment.';

  for (let i = 0; i < MODEL_LIST.length; i++) {
    const model     = MODEL_LIST[i];
    const isLast    = i === MODEL_LIST.length - 1;
    const attempt   = i + 1;

    console.log(`[placement] Attempt ${attempt}/${MODEL_LIST.length} → ${model}`);

    // ── Network call ──────────────────────────────────────────────────
    let resp;
    try {
      resp = await callGemini(model, apiKey, payload);
    } catch (netErr) {
      console.error(`[placement] Network error on ${model}:`, netErr.message);
      lastError = 'Could not reach Gemini API. Check your internet connection.';
      if (isLast) break;
      continue;
    }

    // ── Non-retryable HTTP errors → return immediately ─────────────────
    if (!resp.ok && !RETRYABLE.has(resp.status)) {
      const body = await resp.text().catch(() => '');
      console.error(`[placement] ${model} HTTP ${resp.status}:`, body);

      if (resp.status === 400) {
        return res.status(502).json({
          ok: false,
          error: 'Gemini rejected the image (HTTP 400). Try a smaller JPEG photo.',
        });
      }
      if (resp.status === 403) {
        return res.status(502).json({
          ok: false,
          error: 'Gemini API key is invalid or has no permission (HTTP 403). ' +
                 'Check your GEMINI_API_KEY at https://aistudio.google.com/app/apikey',
        });
      }
      if (resp.status === 404) {
        // This model doesn't exist — try next one silently
        console.warn(`[placement] ${model} returned 404, trying next model…`);
        lastError = `Model ${model} not found. Trying fallback…`;
        continue;
      }

      return res.status(502).json({
        ok: false,
        error: `Gemini API error (HTTP ${resp.status}) on model ${model}.`,
      });
    }

    // ── Retryable errors (429, 500, 503) → log and try next model ─────
    if (!resp.ok) {
      const body = await resp.text().catch(() => '{}');
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { /**/ }
      const msg = parsed?.error?.message || `HTTP ${resp.status}`;
      console.warn(`[placement] ${model} retryable error — ${msg}`);
      lastError = msg;

      if (!isLast) {
        await sleep(300); // tiny pause before trying next model
        continue;
      }
      break;
    }

    // ── Success — parse the response ──────────────────────────────────
    const raw  = await resp.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text.trim()) {
      const reason = raw?.candidates?.[0]?.finishReason ?? 'unknown';
      console.warn(`[placement] ${model} returned empty text. finishReason: ${reason}`);
      lastError = `Gemini returned an empty response (finishReason: ${reason}).`;
      if (!isLast) { continue; }
      break;
    }

    let placementData;
    try {
      placementData = parseGeminiText(text);
    } catch {
      console.warn(`[placement] ${model} returned invalid JSON:`, text.slice(0, 200));
      lastError = 'Gemini returned an unexpected format.';
      if (!isLast) { continue; }
      break;
    }

    console.log(
      `[placement] ✅ ${model} → ` +
      `x:${placementData.x_percent}% y:${placementData.y_percent}% ` +
      `scale:${placementData.scale_factor}`
    );

    return res.json({ ok: true, placement: placementData, model });
  }

  // ── All models failed ─────────────────────────────────────────────────
  console.error('[placement] All models exhausted. Last error:', lastError);
  return res.status(503).json({
    ok:    false,
    error: `Gemini is temporarily overloaded. Please try again in 30 seconds. (${lastError})`,
  });
});

export default router;