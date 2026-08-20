// In local dev, Vite proxies '/api' to localhost:8080 (see vite.config.js).
// In production (Vercel), the frontend and backend live on different domains, so
// VITE_API_URL must point at the deployed backend, e.g. https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('quizly_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    let message = data?.message || `Request failed (${res.status})`;
    if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
      message = Object.entries(data.fieldErrors).map(([k, v]) => `${k}: ${v}`).join('; ');
    }
    const error = new Error(message);
    error.status = res.status;
    error.fieldErrors = data?.fieldErrors;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export { getToken };
