import axios from 'axios';
import { getStudentId } from './studentId';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE,
  timeout: 35_000,
});

api.interceptors.request.use(config => {
  config.headers['X-Student-Id'] = getStudentId();
  return config;
});

export const vivaApi = {
  generate:     (body) => api.post('/api/viva/generate', body).then(r => r.data),
  evaluate:     (body) => api.post('/api/viva/evaluate', body).then(r => r.data),
  report:       (body) => api.post('/api/viva/report', body).then(r => r.data),
  saveSession:  (body) => api.post('/api/viva/sessions', body).then(r => r.data),
  listSessions: ()     => api.get('/api/viva/sessions').then(r => r.data),
  getSession:   (id)   => api.get(`/api/viva/sessions/${id}`).then(r => r.data),
  health:       ()     => api.get('/api/health').then(r => r.data),
};

export default api;
