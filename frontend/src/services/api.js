const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const { headers: requestHeaders = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...requestHeaders,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export function getAuthToken() {
  return localStorage.getItem('digital-heroes-token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('digital-heroes-token', token);
  } else {
    localStorage.removeItem('digital-heroes-token');
  }
}

export function apiGet(path) {
  return request(path, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body || {}),
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export function apiPut(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body || {}),
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: 'PATCH',
    body: JSON.stringify(body || {}),
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export function apiDelete(path) {
  return request(path, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
