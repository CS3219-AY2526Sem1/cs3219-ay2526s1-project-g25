import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';
import { validateForgotPasswordForm } from '../utils/validation';
import toast from 'react-hot-toast';
import './ForgotPasswordModal.css';

function ResendVerificationModal({ isOpen, onClose, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [serverMsg, setServerMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForgotPasswordForm(email);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);
    try {
      const resp = await authService.resendVerification(email);
      // Show and store server-provided message if present
      if (resp && resp.message) {
        setServerMsg(resp.message)
        toast.success(resp.message);
      } else {
        setServerMsg('A verification link has been sent to your email.');
        toast.success('Verification link resent to your email!');
      }
      setEmailSent(true);
    } catch (error) {
      console.error('Resend verification error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to resend verification email';
      // If server returns 400 for known error (e.g. already verified / no account), show it as error
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setLoading(false);
    onClose && onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="forgot-password-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <h2>{emailSent ? '📧 Check Your Email' : '✉️ Resend Verification'}</h2>
              <button className="close-button" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <div className="modal-content">
              {!emailSent ? (
                <>
                  <p className="modal-description">
                    Enter the email address you used to create your account and we'll resend the verification link.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <motion.div
                      className="form-group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label htmlFor="resend-email">Email Address</label>
                      <input
                        type="email"
                        id="resend-email"
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
                        <span className="button-content"><span className="spinner"></span> Sending...</span>
                      ) : (
                        'Resend Verification'
                      )}
                    </motion.button>
                  </form>
                </>
              ) : (
                <motion.div className="success-message" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="success-icon">✓</div>
                  <h3>Email Sent!</h3>
                  <p>{serverMsg || `If an account exists with ${email}, you will receive a verification link shortly.`}</p>
                  <p className="note">Please check your spam folder if you don't see the email within a few minutes.</p>
                  <motion.button className="done-button" onClick={handleClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Done</motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ResendVerificationModal;
