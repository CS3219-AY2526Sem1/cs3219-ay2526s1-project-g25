import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userProfileService from '../services/userProfileService';
import { validateEmail, validatePassword } from '../utils/validation';
import toast from 'react-hot-toast';
import './Profile.css';

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    username: '',
    email: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form to original profile data
  const resetFormToOriginal = () => {
    if (profileData) {
      setGeneralForm({
        username: profileData.username || '',
        email: profileData.email || ''
      });
      setErrors({}); // Clear any validation errors
    }
  };

    // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const data = await userProfileService.getUserProfile(username);
        
        setProfileData(data);
        setIsOwner(data.isOwner === true);
        
        // Pre-populate forms if owner
        if (data.isOwner) {
          setGeneralForm({
            username: data.username || '',
            email: data.email || ''
          });
        }
      } catch (error) {
        userProfileService.handleError(error, navigate);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, navigate]);

  const validateGeneralForm = () => {
    const newErrors = {};
    
    if (!generalForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (generalForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!generalForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(generalForm.email)) {
      newErrors.email = 'Invalid email format';
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
    if (!validateGeneralForm()) return;

    setLoading(true);
    try {
      const result = await userProfileService.updateProfile(username, {
        username: generalForm.username,
        email: generalForm.email
      });
      
      if (result) {
        // Update local user data
        localStorage.setItem('user', JSON.stringify(result));
        setProfileData(prev => ({ ...prev, ...result }));
        
        // If username changed, redirect to new URL
        if (result.username !== username) {
          toast.success('Profile updated successfully!');
          navigate(`/user/${result.username}`);
          return;
        }
      }
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      userProfileService.handleError(error, navigate);
      // Reset form to original values on error to avoid confusion
      resetFormToOriginal();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      await userProfileService.updatePassword(username, passwordForm);
      
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('general');
    } catch (error) {
      userProfileService.handleError(error, navigate);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!deletePassword) {
      toast.error('Please enter your current password');
      return;
    }

    setLoading(true);
    try {
      await userProfileService.deleteAccount(username, deletePassword);
      
      toast.success('Account deleted successfully');
      await authService.logout();
      navigate('/auth');
    } catch (error) {
      userProfileService.handleError(error, navigate);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="profile-header">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>Loading Profile...</h1>
            <div className="profile-avatar-large">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="profile-header">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>Profile Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const renderViewMode = () => (
    <div className="profile-main">
      <div className="tab-content">
        <h3>Profile Information</h3>
        <div className="profile-view">
          <div className="profile-field">
            <label>Username</label>
            <p>{profileData.username}</p>
          </div>
          
          {profileData.email && (
            <div className="profile-field">
              <label>Email</label>
              <p>{profileData.email}</p>
            </div>
          )}
          
          <div className="profile-field">
            <label>Member Since</label>
            <p>{new Date(profileData.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="profile-field">
            <label>Problems Solved</label>
            <div className="difficulty-stats">
              <span className="difficulty-stat easy">
                Easy: {profileData.difficulty_counts?.easy || 0}
              </span>
              <span className="difficulty-stat medium">
                Medium: {profileData.difficulty_counts?.medium || 0}
              </span>
              <span className="difficulty-stat hard">
                Hard: {profileData.difficulty_counts?.hard || 0}
              </span>
            </div>
          </div>

          {isOwner && (
            <button
              className="edit-button"
              onClick={() => {
                resetFormToOriginal(); // Reset form to current values when entering edit mode
                setEditMode(true);
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <>
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
        {activeTab === 'general' && (
          <div className="tab-content">
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
                  className="cancel-button"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="reset-button"
                  onClick={resetFormToOriginal}
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
          </div>
        )}

        {activeTab === 'password' && (
          <div className="tab-content">
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
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="tab-content">
            <h3>Danger Zone</h3>
            <div className="danger-section">
              <div className="danger-warning">
                <h4>⚠️ Delete Account</h4>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              
              {!showDeleteConfirm ? (
                <button
                  className="danger-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirmation">
                  <p>Type <strong>DELETE</strong> to confirm:</p>
                  <input
                    type="text"
                    className="delete-input"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE here"
                  />
                  <p>Enter your current password:</p>
                  <input
                    type="password"
                    className="delete-input"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Current password"
                  />
                  <div className="delete-actions">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirm('');
                        setDeletePassword('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-delete-button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE' || !deletePassword || loading}
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>{isOwner ? 'My Profile' : `${profileData.username}'s Profile`}</h1>
          <div className="profile-avatar-large">
            {profileData.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        <div className="profile-content">
          {!isOwner || !editMode ? renderViewMode() : renderEditMode()}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;