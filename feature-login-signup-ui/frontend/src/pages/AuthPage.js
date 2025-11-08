import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import './AuthPage.css';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import ResendVerificationModal from '../components/ResendVerificationModal';
import FloatingCode from '../components/FloatingCode';
import TypingText from '../components/TypingText';

function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();
  const [showResend, setShowResend] = useState(!!(location.state && location.state.showResendOption));

  useEffect(() => {
    // If already logged in, redirect based on role
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const isAdmin = user?.roles?.includes('admin');
      navigate(isAdmin ? '/admin' : '/dashboard');
    }
  }, [navigate]);

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    const isAdmin = user?.roles?.includes('admin');
    
    if (isAdmin) {
      toast.success('Welcome Admin! 👑');
      navigate('/admin');
    } else {
      toast.success('Welcome back to PeerPrep! 🎉');
      navigate('/dashboard');
    }
  };

  const handleSignupSuccess = () => {
    toast.success('Account created! Please check your email to verify. 📧');
    setActiveTab('login');
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
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
                <TypingText text="Practice. Match. Excel." delay={500} />
              </p>
            </motion.div>
          </div>

          {/* Tab Switcher */}
          <motion.div 
            className="tab-switcher"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
            <motion.div 
              className="tab-indicator"
              animate={{
                x: activeTab === 'signup' ? 'calc(100% - 4px)' : '0px'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            ></motion.div>
          </motion.div>

          {/* Forms */}
          {/* Resend Verification Modal (opened from forms) */}
          <ResendVerificationModal isOpen={showResend} onClose={() => setShowResend(false)} initialEmail={location.state?.email || ''} />

          <motion.div 
            className="form-container"
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'login' ? (
              <LoginForm onSuccess={handleLoginSuccess} showResendSetter={setShowResend} />
            ) : (
              <SignupForm onSuccess={handleSignupSuccess} showResendSetter={setShowResend} />
            )}
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

        {/* Floating Particles removed for simplicity */}
      </motion.div>
    </div>
  );
}

export default AuthPage;

