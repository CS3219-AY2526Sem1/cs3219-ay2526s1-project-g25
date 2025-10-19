import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import './UserProfileDropdown.css';

function UserProfileDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = authService.getCurrentUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully!');
      navigate('/auth');
    } catch (error) {
      toast.success('Logged out successfully!');
      navigate('/auth');
    }
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate(`/user/${user?.username}`);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <motion.button
        className="user-profile-trigger"
        onClick={toggleDropdown}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="user-avatar">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.username || 'User'}</span>
          <span className="user-email">{user?.email || 'user@example.com'}</span>
        </div>
        <motion.div
          className="dropdown-arrow"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="dropdown-user-info">
                <div className="dropdown-username">{user?.username || 'User'}</div>
                <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <motion.button
                className="dropdown-item"
                onClick={handleViewProfile}
                whileHover={{ backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="dropdown-icon">👤</span>
                View Profile
              </motion.button>

              <div className="dropdown-divider"></div>

              <motion.button
                className="dropdown-item logout-item"
                onClick={handleLogout}
                whileHover={{ backgroundColor: '#fef2f2' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="dropdown-icon">🚪</span>
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserProfileDropdown;