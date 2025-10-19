import axios from 'axios';
import authService from './authService';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

// Create axios instance with interceptors for token management
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we're currently refreshing to avoid race conditions
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authService.refreshAccessToken();
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authService.logout();
        throw new Error('SESSION_EXPIRED');
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

class UserProfileService {
  /**
   * Fetch user profile by username
   */
  async getUserProfile(username) {
    try {
      const response = await api.get(`/users/${username}`);
      return response.data.data; // Backend sends data in response.data.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('USER_NOT_FOUND');
      }
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(username, profileData) {
    try {
      const response = await api.patch(`/users/${username}`, profileData);
      // Backend returns { user: updatedUser, usernameChanged: boolean } in response.data.data
      const payload = response.data?.data || {};
      return {
        user: payload.user || null,
        usernameChanged: !!payload.usernameChanged
      };
    } catch (error) {
      if (error.response?.data?.code === 'NO_CHANGES') {
        throw new Error('NO_CHANGES');
      }
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Update user password
   */
  async updatePassword(username, passwordData) {
    try {
      const response = await api.patch(`/users/${username}`, passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update password');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(username, currentPassword) {
    try {
      const response = await api.delete(`/users/${username}`, {
        data: { currentPassword }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  }

  /**
   * Handle service errors and show appropriate toasts
   */
  handleError(error, navigate) {
    switch (error.message) {
      case 'SESSION_EXPIRED':
        toast.error('Session expired. Please login again.');
        authService.logout();
        navigate('/auth');
        break;
      case 'USER_NOT_FOUND':
        toast.error('User not found');
        navigate('/dashboard');
        break;
      case 'NO_CHANGES':
        toast('No changes detected. Profile is already up to date.', {
          icon: 'ℹ️',
          duration: 3000,
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
        break;

      default:
        // Check if it's an authentication error
        if (error.response?.status === 401) {
          toast.error('Please login to view profiles.');
          authService.logout();
          navigate('/auth');
        } else if (error.message.includes('Network Error')) {
          toast.error('Network error. Please try again.');
        } else {
          toast.error(error.message || 'An error occurred');
        }
    }
  }
}

const userProfileService = new UserProfileService();
export default userProfileService;