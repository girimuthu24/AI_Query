import axios from 'axios';

// With Vite proxy active, baseURL is the proxied path.
// Every call like axiosInstance.post('/login/') becomes
// http://127.0.0.1:8000/api/login/ via the Vite dev proxy.
const BASE_URL = import.meta.env.VITE_API_BASE_URL; // '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT access token to every request ────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: on 401 silently refresh token, then retry ──────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        try {
          // Use bare axios to avoid triggering this interceptor again
          const { data } = await axios.post(
            `${BASE_URL}/token/refresh/`,
            { refresh },
            { headers: { 'Content-Type': 'application/json' } }
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return axiosInstance(original); // retry original request
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
