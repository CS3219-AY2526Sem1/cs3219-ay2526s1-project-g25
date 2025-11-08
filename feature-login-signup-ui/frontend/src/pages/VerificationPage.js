import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import FloatingCode from '../components/FloatingCode';
import ResendVerification from '../components/ResendVerification';
import TypingText from '../components/TypingText';
import './AuthPage.css';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

function VerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/verify?token=${token}`);
        setVerificationStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        
        if (error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else if (error.response?.status === 400) {
          setMessage('Invalid or expired verification link.');
        } else if (error.response?.status === 404) {
          setMessage('User not found or already verified.');
        } else {
          setMessage('Verification failed. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinueToLogin = () => {
    navigate('/auth');
  };

  const handleResendVerification = () => {
    // Show inline resend UI on this page instead of navigating away
    setShowInlineResend(true);
  };

  const [showInlineResend, setShowInlineResend] = useState(false);

  const renderContent = () => {
    if (verificationStatus === 'loading') {
      return (
        <motion.div 
          className="verification-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="verification-icon loading">
            <div className="spinner large"></div>
          </div>
          <h2>Verifying Your Email</h2>
          <p>Please wait while we verify your email address...</p>
        </motion.div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <motion.div 
          className="verification-container success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="verification-icon success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            ✅
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Email Verified Successfully!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
          <motion.p
            className="verification-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Your account is now active and ready to use. You can login with your credentials.
          </motion.p>
          <motion.button
            className="verification-button primary"
            onClick={handleContinueToLogin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue to Login
          </motion.button>
        </motion.div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <motion.div 
          className="verification-container error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="verification-icon error"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            ❌
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Verification Failed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
          <motion.div
            className="verification-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {!showInlineResend ? (
              <motion.button
                className="verification-button secondary"
                onClick={handleResendVerification}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Request New Verification
              </motion.button>
            ) : (
              <div style={{ width: '100%' }}>
                <ResendVerification onClose={() => setShowInlineResend(false)} />
              </div>
            )}
            <motion.button
              className="verification-button primary"
              onClick={handleContinueToLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Login
            </motion.button>
          </motion.div>
        </motion.div>
      );
    }
  };

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
          className="auth-card verification-card"
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
                <TypingText text="Email Verification" delay={500} />
              </p>
            </motion.div>
          </div>

          {/* Verification Content */}
          {renderContent()}

          {/* Footer */}
          <motion.div 
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>🔒 Secure verification powered by JWT</p>
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

export default VerificationPage;