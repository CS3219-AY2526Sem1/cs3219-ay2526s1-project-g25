import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import './AuthForms.css';

function ResendVerification({ initialEmail = '', onClose }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleResend = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    try {
      const resp = await authService.resendVerification(email)
      const msg = resp?.message || 'Verification email resent. Please check your inbox. 📧'
      toast.success(msg)
      if (onClose) onClose()
    } catch (error) {
      console.error('Resend verification error:', error)
      const msg = error?.response?.data?.message || error?.message || 'Failed to resend verification email'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleResend} className="auth-form">
      <motion.div
        className="form-description"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p>Enter your email below and we'll resend the verification link.</p>
      </motion.div>

      <motion.div
        className="form-group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="resend-email">Email</label>
        <input
          id="resend-email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <motion.span
            className="error-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.email}
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
            Sending...
          </span>
        ) : (
          'Resend Verification'
        )}
      </motion.button>

      <motion.div
        className="form-links"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button type="button" className="link-button" onClick={() => onClose && onClose()}>
          Cancel
        </button>
      </motion.div>
    </form>
  );
}

export default ResendVerification;
