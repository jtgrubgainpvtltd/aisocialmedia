import axios from 'axios';

const API_BASE_URL = window.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let inMemoryAccessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};

export const setRefreshToken = (token) => {
  if (token) localStorage.setItem('refresh_token', token);
};

export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

export const clearRefreshToken = () => {
  localStorage.removeItem('refresh_token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (isRefreshCall) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const storedRefresh = getRefreshToken();
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, storedRefresh ? { refreshToken: storedRefresh } : {}, {
              withCredentials: true,
              headers: { 'ngrok-skip-browser-warning': 'true' }
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const { data } = await refreshPromise;

        setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) setRefreshToken(data.data.refreshToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        clearRefreshToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => {
    const token = getRefreshToken();
    return api.post('/auth/refresh', token ? { refreshToken: token } : {});
  },
};

export const restaurant = {
  get: () => api.get('/restaurant'),
  update: (data) => api.put('/restaurant', data),
  uploadAsset: (formData) =>
    api.post('/restaurant/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAssets: () => api.get('/restaurant/assets'),
  deleteAsset: (id) => api.delete(`/restaurant/assets/${id}`),
};

export const content = {
  generate: (data) => api.post('/content/generate', data),
  getHistory: (params) => api.get('/content/history', { params }),
  getStats: () => api.get('/content/stats'),
  getById: (id) => api.get(`/content/${id}`),
  delete: (id) => api.delete(`/content/${id}`),

  testCaption: (data) => api.post('/content/test-caption', data),
  testImage: (data) => api.post('/content/test-image', data),
  testFull: (data) => api.post('/content/test-full', data),
};

export const posts = {
  schedule: (data) => api.post('/posts/schedule', data),
  getScheduled: (params) => api.get('/posts/scheduled', { params }),
  getPublished: (params) => api.get('/posts/published', { params }),
  cancelScheduled: (id) => api.delete(`/posts/scheduled/${id}`),
  publishNow: (data) => api.post('/posts/publish', data),
};

export const integrations = {
  getAll: () => api.get('/integrations'),
  connectMeta: (data) => api.post('/integrations/connect-meta', data),
  getMetaOAuthUrl: () => api.get('/integrations/meta/oauth-url'),
  getMetaOAuthPages: () => api.get('/integrations/meta/oauth-pages'),
  completeMetaOAuth: (data) => api.post('/integrations/meta/complete-oauth', data),
  testAll: () => api.get('/integrations/test-all'),
  testUserToken: () => api.get('/integrations/test-user-token'),
  testAppToken: () => api.get('/integrations/test-app-token'),
  testPages: (token) => api.get('/integrations/test-pages', {
    headers: token ? { 'x-meta-user-token': token } : undefined
  }),
  testInstagram: (token) => api.get('/integrations/test-instagram', {
    headers: token ? { 'x-meta-user-token': token } : undefined
  }),
};

export const trends = {
  getCityTrends: (cityName) => api.get(`/trends/city/${encodeURIComponent(cityName)}`),
};

export const locations = {
  getStates: () => api.get('/locations/states'),
  getCitiesByState: (state) => api.get(`/locations/cities/${encodeURIComponent(state)}`),
  getAllCities: () => api.get('/locations/cities'),
  searchCities: (query) => api.get('/locations/search', { params: { q: query } }),
};

export const google = {
  searchPlaces: (params) => api.get('/google/places/search', { params }),
  getPlaceDetails: (placeId) => api.get(`/google/places/${placeId}`),
  getPlaceReviews: (placeId) => api.get(`/google/places/${placeId}/reviews`),
  getCompetitors: (params) => api.get('/google/competitors', { params }),
  getKeywordTrend: (params) => api.get('/google/trends/keyword', { params }),
  getRelatedTrends: (params) => api.get('/google/trends/related', { params }),
  getRealtimeTrends: (params) => api.get('/google/trends/realtime', { params }),
  compareKeywords: (keywords, geo = 'IN') => api.post('/google/trends/compare', { keywords, geo }),
};

export const analytics = {
  getOverview: () => api.get('/analytics/overview'),
  getTopPosts: (limit = 10) => api.get('/analytics/top-posts', { params: { limit } }),
  getInsights: () => api.get('/analytics/insights'),
  getBestTimes: () => api.get('/analytics/best-times'),
};

export const replies = {
  getAll: (params) => api.get('/replies', { params }),
  approve: (id, data) => api.post(`/replies/${id}/approve`, data),
  reject: (id) => api.post(`/replies/${id}/reject`),
};

export default api;
