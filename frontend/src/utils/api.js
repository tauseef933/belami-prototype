/**
 * api.js — Centralized API client for Belami Try-On
 */

const BASE = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, options);
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Fetch all products from the backend.
 * @returns {Promise<{products: Array, total: number}>}
 */
export async function fetchProducts() {
  return request('/products');
}

/**
 * Get AI-powered placement suggestion from Gemini Vision.
 * @param {string} roomBase64  - base64 image (may include data-URL prefix)
 * @param {string} roomMimeType
 * @param {object} product     - { name, width, height, depth, placement }
 * @returns {Promise<{placement: object}>}
 */
export async function getPlacementSuggestion(roomBase64, roomMimeType = 'image/jpeg', product) {
  // Strip data-URL prefix before sending — backend handles either way
  const pureBase64 = roomBase64.replace(/^data:[^;]+;base64,/, '');

  return request('/placement', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ roomBase64: pureBase64, roomMimeType, product }),
  });
}

/**
 * Submit a room image + product SKU for try-on processing.
 * @param {File}   roomFile
 * @param {string} productSku
 * @param {string} prompt
 */
export async function submitTryOn(roomFile, productSku, prompt = '') {
  const formData = new FormData();
  formData.append('room',       roomFile);
  formData.append('productSku', productSku);
  formData.append('prompt',     prompt);

  return request('/tryon', { method: 'POST', body: formData });
}

/**
 * Health check.
 */
export async function checkHealth() {
  return request('/health');
}
