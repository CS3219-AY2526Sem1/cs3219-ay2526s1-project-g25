import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import './AuthForms.css';

function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await authService.login(formData);
      onSuccess();
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <motion.div 
        className="form-group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="identifier">Email or Username</label>
        <input
          type="text"
          id="identifier"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          placeholder="Enter your email or username"
          className={errors.identifier ? 'error' : ''}
        />
        {errors.identifier && <motion.span 
          className="error-text"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.identifier}</motion.span>}
      </motion.div>

      <motion.div 
        className="form-group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <motion.span 
          className="error-text"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.password}</motion.span>}
      </motion.div>

      <motion.button 
        type="submit" 
        className="submit-button" 
        disabled={loading}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <span className="button-content">
            <span className="spinner"></span>
            Logging in...
          </span>
        ) : (
          'Login'
        )}
      </motion.button>

      <motion.div 
        className="form-links"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button 
          type="button" 
          className="link-button admin-link" 
          onClick={() => window.location.href = 'http://localhost:3002'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          👑 Admin? Click here
        </motion.button>
      </motion.div>
    </form>
  );
}

export default LoginForm;

