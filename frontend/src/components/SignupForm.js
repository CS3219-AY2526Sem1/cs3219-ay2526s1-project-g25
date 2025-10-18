import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import { validateSignupForm, getSignupErrorMessage } from '../utils/validation';
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
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Create a strong password' },
    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password' }
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

      <motion.button 
        type="submit" 
        className="submit-button" 
        disabled={loading}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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

