import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import { validatePassword } from '../utils/validation';
import toast from 'react-hot-toast';
import './Profile.css';

const API_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001';

function EditProfile() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // General info form
  const [generalForm, setGeneralForm] = useState({
    username: '',
    email: ''
  });

  // Reset form to original user data when component mounts or user data changes
  useEffect(() => {
    if (user) {
      setGeneralForm({
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [errors, setErrors] = useState({});

  // Reset form to original user data
  const resetGeneralForm = () => {
    if (user) {
      setGeneralForm({
        username: user.username || '',
        email: user.email || ''
      });
      setErrors({}); // Clear any validation errors
    }
  };

  const validateGeneralForm = () => {
    const newErrors = {};
    
    if (!generalForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (generalForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    

    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    
    if (!validateGeneralForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = authService.getAccessToken();
      const requestUrl = `${API_URL}/users/${user?.username}`;
      const requestBody = {
        username: generalForm.username
      };
      
      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update local user data
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          const updatedUser = { ...user, username: generalForm.username };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
        // Reset form to original values on error to avoid confusion
        resetGeneralForm();
      }
    } catch (error) {
      console.error('=== Network Error Details ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('This appears to be a network connectivity issue');
        console.error('Check if the backend server is running at:', API_URL);
        toast.error('Cannot connect to backend server. Check if user service is running on port 3001.');
      } else if (error.message.includes('JSON')) {
        console.error('Response was not valid JSON - likely an HTML error page');
        toast.error('Backend endpoint not found. Profile update feature needs to be implemented.');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user?.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user?.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword
        })
      });
      
      if (response.ok) {
        toast.success('Account deleted successfully');
        await authService.logout();
        navigate('/auth');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <motion.div
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3>General Information</h3>
            <form onSubmit={handleUpdateGeneral}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={generalForm.username}
                  onChange={(e) => setGeneralForm({ ...generalForm, username: e.target.value })}
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={generalForm.email}
                  readOnly
                  className="readonly-field"
                  title="Email editing is currently disabled"
                />
                <div className="field-hint">
                  Email editing is temporarily disabled. Contact support if you need to change your email.
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="reset-button"
                  onClick={resetGeneralForm}
                  disabled={loading}
                >
                  Reset to Original
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case 'password':
        return (
          <motion.div
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3>Change Password</h3>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={errors.currentPassword ? 'error' : ''}
                />
                {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                
                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li className={passwordForm.newPassword.length >= 12 ? 'valid' : ''}>
                      At least 12 characters
                    </li>
                    <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                      Uppercase letter
                    </li>
                    <li className={/[a-z]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                      Lowercase letter
                    </li>
                    <li className={/\d/.test(passwordForm.newPassword) ? 'valid' : ''}>
                      Number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                      Special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </motion.div>
        );

      case 'danger':
        return (
          <motion.div
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3>Danger Zone</h3>
            <div className="danger-section">
              <div className="danger-warning">
                <h4>⚠️ Delete Account</h4>
                <p>
                  Once you delete your account, there is no going back. This will permanently 
                  delete your profile, all your data, and remove your access to PeerPrep.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  className="danger-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete My Account
                </button>
              ) : (
                <div className="delete-confirmation">
                  <p>Are you absolutely sure? Type <strong>DELETE</strong> to confirm:</p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE here"
                    className="delete-input"
                  />
                  <div className="delete-actions">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirm('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-delete-button"
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirm !== 'DELETE'}
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Edit Profile</h1>
          <div className="profile-avatar-large">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <nav className="profile-nav">
              <button
                className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                👤 General
              </button>
              <button
                className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                🔒 Password
              </button>
              <button
                className={`nav-item danger ${activeTab === 'danger' ? 'active' : ''}`}
                onClick={() => setActiveTab('danger')}
              >
                ⚠️ Danger Zone
              </button>
            </nav>
          </div>

          <div className="profile-main">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;