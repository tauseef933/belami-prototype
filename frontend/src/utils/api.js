const BASE = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, options);
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function fetchProducts() {
  return request('/products');
}

export async function checkHealth() {
  return request('/health');
}
