import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
  try {
    const t = await SecureStore.getItemAsync('csx_token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  } catch {}
  return cfg;
});

api.interceptors.response.use(r => r, async (err) => {
  if (err.response?.status === 401) await SecureStore.deleteItemAsync('csx_token').catch(() => {});
  return Promise.reject(err);
});

// Auth
export const apiLogin   = (email, password) => api.post('/api/auth/login', { email, password });
export const apiMe      = () => api.get('/api/auth/me');
export const apiLogout  = () => api.post('/api/auth/logout');

// Dashboard
export const apiDashboard = () => api.get('/api/dashboard/stats');

// Scans
export const apiScans      = (p) => api.get('/api/scans', { params: p });
export const apiScanLaunch = (d) => api.post('/api/scans', d);
export const apiScanGet    = (id) => api.get(`/api/scans/${id}`);

// OSINT
export const apiOsintDomain = (domain) => api.post('/api/osint/domain', { domain });
export const apiOsintIP     = (ip)     => api.post('/api/osint/ip', { ip });
export const apiOsintEmail  = (email)  => api.post('/api/osint/email', { email });
export const apiOsintHash   = (hash)   => api.post('/api/osint/hash', { hash });
export const apiOsintHistory= () => api.get('/api/osint/history');

// Threats / IOC
export const apiThreats     = (p) => api.get('/api/threats', { params: p });
export const apiThreatStats = () => api.get('/api/threats/stats');
export const apiIocCheck    = (value) => api.post('/api/threats/check', { value });
export const apiIocAdd      = (d) => api.post('/api/threats/ioc', d);
export const apiThreatFeed  = () => api.get('/api/threats/feed');

// Assets
export const apiAssets      = () => api.get('/api/assets');
export const apiAssetCreate = (d) => api.post('/api/assets', d);
export const apiAssetUpdate = (id, d) => api.put(`/api/assets/${id}`, d);
export const apiAssetDelete = (id) => api.delete(`/api/assets/${id}`);

// Incidents
export const apiIncidents      = () => api.get('/api/incidents');
export const apiIncidentCreate = (d) => api.post('/api/incidents', d);
export const apiIncidentUpdate = (id, d) => api.put(`/api/incidents/${id}`, d);

// Compliance
export const apiCompliance = () => api.get('/api/compliance');

// Reports
export const apiReports        = () => api.get('/api/reports');
export const apiReportGenerate = (d) => api.post('/api/reports/generate', d);

// Audit
export const apiAudit = () => api.get('/api/audit');

// Contact
export const apiContact = (d) => api.post('/api/contact', d);

export default api;
