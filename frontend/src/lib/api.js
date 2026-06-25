import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;
export const MEDIA_BASE = `${BACKEND_URL}`; // images served from /api/media/...

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}
