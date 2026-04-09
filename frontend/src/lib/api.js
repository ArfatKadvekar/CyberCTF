import axios from 'axios';

let banBlocked = false;

const isAuthPath = (url = '') => url.startsWith('/auth/');
const isBanResponse = (error) => error?.response?.status === 403 && error?.response?.data?.banned === true;

export const clearBanBlock = () => {
  banBlocked = false;
};

// Determine API base URL with smart fallback strategy
// Priority 1: VITE_API_URL environment variable (set in Vercel dashboard)
// Priority 2: Production fallback to Render backend
// Priority 3: Development proxy to localhost:5000
const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  
  if (url && url.trim() !== '') {
    return url.trim();
  }

  // Fallback if VITE_API_URL is missing
  if (import.meta.env.DEV) {
    return '/api'; // Use Vite proxy for local dev
  }
  
  return 'https://cyberctf.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (banBlocked && !isAuthPath(config.url || '')) {
    return Promise.reject({
      response: {
        status: 403,
        data: {
          message: 'You are banned',
          reason: 'Violation of rules',
          banned: true
        }
      }
    });
  }

  const token = localStorage.getItem('ctf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Treat 403 as a ban only when backend explicitly marks it as banned.
    if (isBanResponse(error)) {
      const reason = error.response?.data?.reason || error.response?.data?.message || 'Violation of rules';

      banBlocked = true;
      localStorage.removeItem('ctf_token');
      localStorage.removeItem('ctf_user');

      window.dispatchEvent(new CustomEvent('ctf:user-banned', {
        detail: { reason }
      }));
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

// Categories API
export const categoriesApi = {
  get: (eventId) => api.get('/categories', { params: { eventId } })
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
  // Leaderboard
  getLeaderboard: (eventId) => api.get(`/admin/leaderboard/${eventId}`),
  getLeaderboardProgression: (eventId, limit = 10) => api.get(`/admin/leaderboard/${eventId}/progression`, { params: { limit } }),
  exportLeaderboardPDF: (eventId) => api.get(`/admin/leaderboard/${eventId}/export`, { responseType: 'blob' }),
  
  // Events
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  
  // Categories
  getCategories: (eventId) => api.get('/admin/categories', { params: { eventId } }),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // Challenges
  getChallenges: (eventId) => api.get('/admin/challenges', { params: { eventId } }),
  createChallenge: (data) => api.post('/admin/challenges', data),
  updateChallenge: (id, data) => api.put(`/admin/challenges/${id}`, data),
  deleteChallenge: (id) => api.delete(`/admin/challenges/${id}`),
  
  // Users
  getUsers: (eventId, role) => api.get('/admin/users', { params: { eventId, role } }),
  banUser: (id, banReason) => api.post(`/admin/ban/${id}`, { banReason }),
  unbanUser: (id) => api.post(`/admin/unban/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  resetUser: (id) => api.post(`/admin/users/${id}/reset`)
};

export default api;
