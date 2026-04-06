import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
