import axios from 'axios';

// Determine API base URL with smart fallback strategy
// Priority 1: VITE_API_URL environment variable (set in Vercel dashboard)
// Priority 2: Production fallback to Render backend
// Priority 3: Development proxy to localhost:5000
const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  
  if (url && url.trim() !== '') {
    console.log('[API] ✓ Using VITE_API_URL environment variable:', url);
    return url.trim();
  }

  // Fallback if VITE_API_URL is missing
  if (import.meta.env.DEV) {
    console.log('[API] ℹ Development mode: using /api proxy');
    return '/api'; // Use Vite proxy for local dev
  }
  
  const backendURL = 'https://cyberctf.onrender.com/api';
  console.log('[API] ⚠ Using hardcoded production backend (VITE_API_URL not set):', backendURL);
  console.log('[API] → Tip: Set VITE_API_URL in Vercel dashboard for better flexibility');
  return backendURL;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ctf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request for debugging
  console.log('[API] Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    fullURL: config.baseURL + config.url,
    hasToken: !!token
  });
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 404 errors for debugging
    if (error.response?.status === 404) {
      console.error('[API] 404 Error - Route not found:', {
        endpoint: error.config?.url,
        fullURL: error.config?.baseURL + error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }
    
    // Log CORS errors
    if (error.message === 'Network Error' && !error.response) {
      console.error('[API] Network Error - Possible CORS issue:', {
        endpoint: error.config?.url,
        baseURL: error.config?.baseURL,
        hint: 'Check browser Network tab for CORS errors'
      });
    }
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('ctf_token');
      localStorage.removeItem('ctf_user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  join: (username, gamePin) => api.post('/auth/join', { username, gamePin }),
  adminLogin: (username, password) => api.post('/auth/admin/login', { username, password }),
  validatePin: (gamePin) => api.post('/auth/validate-pin', { gamePin }),
  getMe: () => api.get('/auth/me')
};

// Challenges API
export const challengesApi = {
  getAll: () => api.get('/challenges'),
  getOne: (id) => api.get(`/challenges/${id}`),
  submitFlag: (id, flag) => api.post(`/challenges/${id}/submit`, { flag }),
  unlockHint: (challengeId, hintIndex) => api.post(`/challenges/${challengeId}/hints/${hintIndex}/unlock`)
};

// Leaderboard API
export const leaderboardApi = {
  get: () => api.get('/leaderboard'),
  getHistory: () => api.get('/leaderboard/history')
};

// User API
export const userApi = {
  getRank: () => api.get('/user/rank')
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (eventId) => api.get(`/admin/analytics/${eventId}`),
  exportLeaderboardPDF: (eventId) => api.get(`/admin/leaderboard/${eventId}/export`, { responseType: 'blob' }),
  
  // Events
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  
  // Challenges
  getChallenges: (eventId) => api.get('/admin/challenges', { params: { eventId } }),
  createChallenge: (data) => api.post('/admin/challenges', data),
  updateChallenge: (id, data) => api.put(`/admin/challenges/${id}`, data),
  deleteChallenge: (id) => api.delete(`/admin/challenges/${id}`),
  
  // Users
  getUsers: (eventId, role) => api.get('/admin/users', { params: { eventId, role } }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  resetUser: (id) => api.post(`/admin/users/${id}/reset`)
};

export default api;
