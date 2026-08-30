/**
 * services/api.js
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * Axios instance with:
 *   - Base URL from VITE_API_URL env var (default: http://localhost:8000)
 *   - Request interceptor: auto-attaches Authorization: Bearer <token>
 *   - Response interceptor: on 401 → clears localStorage + redirects to /login
 *
 * Named exports:
 *   - apiClient         : raw axios instance (for custom calls)
 *   - getMe()           : GET  /users/me
 *   - updateMe(data)    : PUT  /users/me
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── Create axios instance ── */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 s
});

/* ── Request Interceptor ──
   Attaches the JWT from localStorage to every outgoing request.
   This runs before the request is sent. */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor ──
   Catches 401 Unauthorized globally.
   Clears stored credentials and redirects the user to /login
   without needing to import the auth context here. */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Hard redirect — avoids circular dependency with AuthContext
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

/* ================================================================
   Named API helpers
   ================================================================ */

/**
 * GET /users/me
 * Returns the currently authenticated user's profile.
 */
export async function getMe() {
  const { data } = await apiClient.get('/users/me');
  return data;
}

/**
 * PUT /users/me
 * Updates the current user's profile fields.
 * @param {object} payload - Fields to update (name, etc.)
 */
export async function updateMe(payload) {
  const { data } = await apiClient.put('/users/me', payload);
  return data;
}

/**
 * POST /auth/login
 * @param {string} email
 * @param {string} password
 * @returns {{ access_token: string, token_type: string, user: object }}
 */
export async function loginRequest(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

/**
 * POST /auth/register
 * @param {object} payload - { email, password, name, role? }
 */
export async function registerRequest(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
}
