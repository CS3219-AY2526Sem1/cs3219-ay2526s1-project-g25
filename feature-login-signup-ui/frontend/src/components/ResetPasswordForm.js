import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import { validateResetPasswordForm, getPasswordResetErrorMessage} from '../utils/validation';
import toast from 'react-hot-toast';
import './AuthForms.css';

function ResetPasswordForm({ accessToken, onSuccess }) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const validation = validateResetPasswordForm(formData);
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
      await authService.resetPassword(accessToken, formData.newPassword, formData.confirmNewPassword);
      toast.success('Password reset successfully! You can now login. 🎉');
      onSuccess();
    } catch (error) {
      console.error('Password reset error:', error);
      const message = getPasswordResetErrorMessage(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <motion.div 
        className="form-description"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p>Create a new password for your account.</p>
      </motion.div>

      <motion.div 
        className="form-group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="newPassword">New Password</label>
        <input
          type="password"
          id="newPassword"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          placeholder="Enter new password"
          className={errors.newPassword ? 'error' : ''}
        />
        {errors.newPassword && (
          <motion.span 
            className="error-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.newPassword}
          </motion.span>
        )}
        <div className="password-requirements">
          <p>Password must contain:</p>
          <ul>
            <li className={formData.newPassword.length >= 12 ? 'valid' : ''}>
              At least 12 characters
            </li>
            <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
              Uppercase letter
            </li>
            <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
              Lowercase letter
            </li>
            <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
              Number
            </li>
            <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'valid' : ''}>
              Special character
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div 
        className="form-group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="confirmNewPassword">Confirm New Password</label>
        <input
          type="password"
          id="confirmNewPassword"
          value={formData.confirmNewPassword}
          onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
          placeholder="Confirm new password"
          className={errors.confirmNewPassword ? 'error' : ''}
        />
        {errors.confirmNewPassword && (
          <motion.span 
            className="error-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.confirmNewPassword}
          </motion.span>
        )}
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
            {' '}
            Resetting...
          </span>
        ) : (
          'Reset Password'
        )}
      </motion.button>
    </form>
  );
}

export default ResetPasswordForm;
