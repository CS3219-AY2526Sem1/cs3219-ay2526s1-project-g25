import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Login.css';

const USER_SERVICE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, credentials);
      const { accessToken, user } = response.data;

      // Check if user has admin role
      if (!user.roles || !user.roles.includes('admin')) {
        toast.error('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');
      onLogin(accessToken, user);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎯 Question Admin Panel</h1>
          <p>Login with your admin credentials</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              id="identifier"
              value={credentials.identifier}
              onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        <div className="login-footer">
          <p>⚡ Secure admin authentication</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

