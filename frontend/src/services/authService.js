import axios from 'axios';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async signup(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  }

  async login(credentials) {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    } catch (error) {
      // If refresh fails, clear all tokens
      this.logout();
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  async requestPasswordReset(email) {
    const response = await axios.post(`${API_URL}/auth/password-reset`, { email });
    return response.data;
  }
}

export default new AuthService();