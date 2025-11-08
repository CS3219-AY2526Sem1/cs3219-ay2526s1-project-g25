import axios from "axios";

const API_URL =
  process.env.REACT_APP_USER_SERVICE_URL || "http://localhost:3001";

class AuthService {
  constructor() {
    // 🔹 Load token on startup (helps for page reloads)
    const token = localStorage.getItem("accessToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }

  /* ─────────── REGISTER ─────────── */
  async signup(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  }

  /* ─────────── LOGIN ─────────── */
  async login(credentials) {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);

    if (response.data.accessToken) {
      const { accessToken, refreshToken, user } = response.data;

      // ✅ Always clear old data before saving new user
      localStorage.clear();

      // ✅ Save new tokens and user info
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Update axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      // ✅ Force reload to reset state
      window.location.reload();
    }

    return response.data;
  }

  /* ─────────── REFRESH ACCESS TOKEN ─────────── */
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      const { accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      return accessToken;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  /* ─────────── LOGOUT ─────────── */
  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");

    // ✅ Clear any axios auth header immediately
    delete axios.defaults.headers.common["Authorization"];

    // ✅ Clear all tokens and user data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // ✅ Notify backend (optional, safe to fail)
    if (refreshToken) {
      try {
        await axios.post(`${API_URL}/auth/logout`, { refreshToken });
      } catch (error) {
        console.warn("Backend logout failed:", error);
      }
    }
  }

  /* ─────────── HELPERS ─────────── */
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getAccessToken() {
    return localStorage.getItem("accessToken");
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /* ─────────── PASSWORD RESET ─────────── */
  async requestPasswordReset(email) {
    const response = await axios.post(`${API_URL}/auth/password-reset`, {
      email,
    });
    return response.data;
  }

  async resetPassword(accessToken, newPassword, confirmNewPassword) {
    const response = await axios.post(
      `${API_URL}/auth/password-reset/confirm`,
      {
        accessToken,
        newPassword,
        confirmNewPassword,
      }
    );
    return response.data;
  }
}

const authService = new AuthService();
export default authService;
