// src/services/api.js
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 30000,
});

// Global response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error. Please try again.';
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const mockLogin = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// ── Reports (legacy) ─────────────────────────────────────────────────────────
export const submitReport = (formData) =>
  api.post('/report', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getMyReports = () => api.get('/reports');
export const getLeaderboard = () => api.get('/leaderboard');

// ── AI-Powered Reports ───────────────────────────────────────────────────────
export const submitReportAI = (formData) =>
  api.post('/report/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });

export const verifyImageAI = (formData) =>
  api.post('/report/verify-image', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminReports = (filters = {}) => api.get('/admin/reports', { params: filters });
export const getAdminStats = () => api.get('/admin/stats');
export const actionReport = (id, action, adminNote) =>
  api.put(`/admin/report/${id}`, { action, adminNote });

export default api;
