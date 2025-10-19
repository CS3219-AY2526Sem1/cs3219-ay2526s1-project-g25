import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import FloatingCode from '../components/FloatingCode';
import TypingText from '../components/TypingText';
import authService from '../services/authService';
import './AuthPage.css';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

function EmailChangeVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmailChange = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/verify-email-change?token=${token}`);
        setVerificationStatus('success');
        setMessage(response.data.message || 'Email updated successfully!');
        
        // Update the user data in localStorage if they are logged in
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          // Refresh user data to get the updated email
          // This would ideally fetch the updated user data from the server
          // For now, we'll just show success message
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        
        if (error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else if (error.response?.status === 400) {
          setMessage('Invalid or expired verification link.');
        } else if (error.response?.status === 404) {
          setMessage('User not found or verification token invalid.');
        } else {
          setMessage('Email verification failed. Please try again or contact support.');
        }
      }
    };

    verifyEmailChange();
  }, [searchParams]);

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="auth-page">
      <FloatingCode />
      
      <div className="auth-container">
        <div className="auth-left">
          <div className="branding">
            <div className="logo">
              <div className="logo-brackets">
                <span className="bracket left">{'{'}</span>
                <span className="logo-text">PeerPrep</span>
                <span className="bracket right">{'}'}</span>
              </div>
            </div>
            
            <div className="tagline">
              <TypingText 
                text="Email Verification" 
                speed={50}
                className="typing-tagline"
              />
            </div>
          </div>
        </div>

        <div className="auth-right">
          <motion.div
            className="verification-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="verification-content">
              {verificationStatus === 'loading' && (
                <div className="verification-loading">
                  <div className="spinner"></div>
                  <h2>Verifying Email Change...</h2>
                  <p>Please wait while we verify your email change request.</p>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="verification-success">
                  <div className="success-icon">✅</div>
                  <h2>Email Updated Successfully!</h2>
                  <p>{message}</p>
                  <div className="verification-actions">
                    <button 
                      className="continue-button"
                      onClick={handleContinueToDashboard}
                    >
                      Continue to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="verification-error">
                  <div className="error-icon">❌</div>
                  <h2>Email Verification Failed</h2>
                  <p>{message}</p>
                  <div className="verification-actions">
                    <button 
                      className="retry-button"
                      onClick={handleBackToLogin}
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default EmailChangeVerificationPage;