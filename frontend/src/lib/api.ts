import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    apiClient.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  
  getProfile: () =>
    apiClient.get('/auth/me'),
  
  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    apiClient.put('/auth/me', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/change-password', data),
  
  logout: () =>
    apiClient.post('/auth/logout'),
};

// Posts API
export const postsAPI = {
  getPosts: (params?: { status?: string; platform?: string; page?: number; limit?: number }) =>
    apiClient.get('/posts', { params }),
  
  getPost: (id: string) =>
    apiClient.get(`/posts/${id}`),
  
  createPost: (data: {
    content: string;
    imageUrl?: string;
    platforms: string[];
    scheduledAt?: string;
    metadata?: Record<string, unknown>;
  }) =>
    apiClient.post('/posts', data),
  
  updatePost: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/posts/${id}`, data),
  
  deletePost: (id: string) =>
    apiClient.delete(`/posts/${id}`),
  
  schedulePost: (id: string, scheduledAt: string) =>
    apiClient.post(`/posts/${id}/schedule`, { scheduledAt }),
  
  publishNow: (id: string) =>
    apiClient.post(`/posts/${id}/publish`),
  
  cancelSchedule: (id: string) =>
    apiClient.post(`/posts/${id}/cancel`),
};

// AI API
export const aiAPI = {
  generateContent: (data: {
    prompt: string;
    type: 'caption' | 'image' | 'both';
    platform?: string;
    tone?: string;
    length?: string;
  }) =>
    apiClient.post('/ai/generate', data),
  
  enhancePrompt: (data: { prompt: string; platform?: string; tone?: string }) =>
    apiClient.post('/ai/enhance-prompt', data),
  
  getUsage: () =>
    apiClient.get('/ai/usage'),
};

// Social Media API
export const socialAPI = {
  getConnectedAccounts: () =>
    apiClient.get('/social/accounts'),
  
  connectAccount: (platform: string) =>
    apiClient.post(`/social/connect/${platform}`),
  
  disconnectAccount: (platform: string) =>
    apiClient.delete(`/social/accounts/${platform}`),
  
  getOAuthUrl: (platform: string) =>
    apiClient.get(`/social/oauth/${platform}/url`),
};

// Health check
export const healthAPI = {
  check: () =>
    apiClient.get('/health'),
};

export default apiClient;