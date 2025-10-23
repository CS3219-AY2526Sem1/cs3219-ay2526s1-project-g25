import axios from 'axios';
import authService from './authService';
import toast from 'react-hot-toast';

const QUESTION_SERVICE_URL = process.env.REACT_APP_QUESTION_SERVICE_URL || 'http://localhost:5050';

// Create axios instance for question service
const apiClient = axios.create({
  baseURL: QUESTION_SERVICE_URL,
});

// Request interceptor to add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newToken = await authService.refreshAccessToken();
        
        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        toast.error('Session expired. Please login again.');
        authService.logout();
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1000);
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

