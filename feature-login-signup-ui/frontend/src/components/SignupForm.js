/**
 * AI Assistance Disclosure:
 * Tool: GitHub Copilot, date: Sept-Oct 2025
 * Scope: Used for form structure and animations
 * Author review: I designed the signup flow and security requirements and reviewed all generated code
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import { validateSignupForm, getSignupErrorMessage } from '../utils/validation';
import toast from 'react-hot-toast';
import './AuthForms.css';

function SignupForm({ onSuccess, showResendSetter }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const validation = validateSignupForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
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
      const message = getSignupErrorMessage(error);
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

      <motion.div 
        className="form-links"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
      >
        <motion.button
          type="button"
          className="link-button resend-verification-link"
          onClick={() => showResendSetter && showResendSetter(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Resend Verification Email
        </motion.button>
      </motion.div>
    </form>
  );
}

export default SignupForm;

