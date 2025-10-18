import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import './AuthForms.css';

function SignupForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    // At least 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return password.length >= 12 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await authService.signup(formData);
      onSuccess();
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { id: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
    { id: 'password', label: 'Password', type: showPassword ? 'text' : 'password', placeholder: 'Create a strong password' },
    { id: 'confirmPassword', label: 'Confirm Password', type: showPassword ? 'text' : 'password', placeholder: 'Confirm your password' }
  ];

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {formFields.map((field, index) => (
        <motion.div 
          key={field.id}
          className="form-group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + index * 0.1 }}
        >
          <label htmlFor={field.id}>{field.label}</label>
          <input
            type={field.type}
            id={field.id}
            value={formData[field.id]}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            className={errors[field.id] ? 'error' : ''}
          />
          {errors[field.id] && <motion.span 
            className="error-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >{errors[field.id]}</motion.span>}
        </motion.div>
      ))}

      <motion.div 
        className="show-password-group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          <span>Show password</span>
        </label>
      </motion.div>

      <motion.button 
        type="submit" 
        className="submit-button" 
        disabled={loading}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <span className="button-content">
            <span className="spinner"></span>
            Creating account...
          </span>
        ) : (
          'Sign Up'
        )}
      </motion.button>
    </form>
  );
}

export default SignupForm;

