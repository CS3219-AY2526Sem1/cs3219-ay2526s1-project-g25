import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ResetPasswordForm from '../components/ResetPasswordForm';
import FloatingCode from '../components/FloatingCode';
import TypingText from '../components/TypingText';
import './AuthPage.css';

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract access token from URL hash (Supabase format)
    // Format: #access_token=xxx&expires_in=3600&refresh_token=xxx&token_type=bearer&type=recovery
    const hash = location.hash;
    
    if (!hash) {
      toast.error('Invalid reset link');
      setTimeout(() => navigate('/auth'), 2000);
      setLoading(false);
      return;
    }

    // Parse the hash to extract access_token
    const params = new URLSearchParams(hash.substring(1)); // Remove the '#' character
    const token = params.get('access_token');
    const type = params.get('type');

    if (!token || type !== 'recovery') {
      toast.error('Invalid or expired reset link');
      setTimeout(() => navigate('/auth'), 2000);
      setLoading(false);
      return;
    }

    setAccessToken(token);
    setLoading(false);
  }, [location, navigate]);

  const handleResetSuccess = () => {
    setTimeout(() => navigate('/auth'), 1500);
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="animated-bg">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
          <div className="gradient-blob blob-3"></div>
        </div>
        <motion.div 
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="spinner large"></div>
          <p>Verifying reset link...</p>
        </motion.div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="auth-page">
        <div className="animated-bg">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
          <div className="gradient-blob blob-3"></div>
        </div>
        <motion.div 
          className="error-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="error-icon">⚠️</div>
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or has expired.</p>
          <p>Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
        <div className="circuit-lines">
          {[...Array(20)].map((_, i) => (
            <div key={`circuit-${i}`} className="circuit-line" style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}></div>
          ))}
        </div>
      </div>

      {/* Floating Code Snippets */}
      <FloatingCode />

      {/* Main Content */}
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="auth-card"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Logo Section */}
          <div className="auth-header">
            <motion.div 
              className="logo-container"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
            >
              <div className="logo">
                <motion.span 
                  className="logo-bracket"
                  animate={{ 
                    rotateY: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {'<'}
                </motion.span>
                <motion.span 
                  className="logo-text"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  PeerPrep
                </motion.span>
                <motion.span 
                  className="logo-bracket"
                  animate={{ 
                    rotateY: [0, -360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {'>'}
                </motion.span>
              </div>
              <p className="tagline">
                <TypingText text="Reset Your Password" delay={500} />
              </p>
            </motion.div>
          </div>

          {/* Header */}
          <motion.div 
            className="tab-switcher"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="forgot-password-header">
              <h2>Create New Password</h2>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div 
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <ResetPasswordForm accessToken={accessToken} onSuccess={handleResetSuccess} />
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>🔒 Secure authentication powered by JWT</p>
          </motion.div>
        </motion.div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="particle"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: [null, -100, null],
                x: [null, Math.random() * 100 - 50, null],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPasswordPage;
