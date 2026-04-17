import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('csx_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('csx_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
