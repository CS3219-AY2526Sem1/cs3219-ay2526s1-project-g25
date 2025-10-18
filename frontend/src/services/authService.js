import axios from 'axios';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

class AuthService {
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

  async resetPassword(accessToken, newPassword, confirmNewPassword) {
    const response = await axios.post(`${API_URL}/auth/password-reset/confirm`, {
      accessToken,
      newPassword,
      confirmNewPassword
    });
    return response.data;
  }
}

const authService = new AuthService();
export default authService;