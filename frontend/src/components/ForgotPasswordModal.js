import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';
import { validateForgotPasswordForm } from '../utils/validation';
import toast from 'react-hot-toast';
import './ForgotPasswordModal.css';

function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForgotPasswordForm(email);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      console.error('Password reset request error:', error);
      // Backend returns same message for security, but we handle errors gracefully
      toast.success('If the email exists, a reset link has been sent.');
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="forgot-password-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <h2>{emailSent ? '📧 Check Your Email' : '🔐 Reset Password'}</h2>
              <button className="close-button" onClick={handleClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="modal-content">
              {!emailSent ? (
                <>
                  <p className="modal-description">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <motion.div 
                      className="form-group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label htmlFor="reset-email">Email Address</label>
                      <input
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={loading}
                        autoFocus
                      />
                    </motion.div>

                    <motion.button
                      type="submit"
                      className="submit-button"
                      disabled={loading}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <span className="button-content">
                          <span className="spinner"></span>
                          Sending...
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </motion.button>
                  </form>
                </>
              ) : (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="success-icon">✓</div>
                  <h3>Email Sent!</h3>
                  <p>
                    If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                  </p>
                  <p className="note">
                    Please check your spam folder if you don't see the email within a few minutes.
                  </p>
                  <motion.button
                    className="done-button"
                    onClick={handleClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ForgotPasswordModal;

