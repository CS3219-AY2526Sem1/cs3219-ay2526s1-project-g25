import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import UserProfileDropdown from '../components/UserProfileDropdown';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();



  const handleStartMatching = () => {
  const token = authService.getAccessToken();
  if (!token) {
    toast.error("Please log in again");
    navigate("/auth");
    return;
  }

  const matchingUIUrl =
    process.env.REACT_APP_MATCHING_UI_URL || "http://localhost:3002";

  // Redirect with token as query param
  // eslint-disable-next-line no-restricted-globals
  window.location.href = `${matchingUIUrl}/match?token=${token}`;
};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">💡</span>
            <span className="logo-text">PeerPrep</span>
          </div>
          <div className="user-section">
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome back, {user?.username}! 👋</h1>
          <p>Ready to practice and improve your coding skills?</p>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">🎯</div>
            <h3>Find a Match</h3>
            <p>Get paired with a peer at your skill level</p>
            <button className="card-button" onClick={handleStartMatching}>Start Matching</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💻</div>
            <h3>Practice Problems</h3>
            <p>Browse and solve coding challenges</p>
            <button className="card-button">View Problems</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Your Progress</h3>
            <p>Track your improvement over time</p>
            <button className="card-button">View Stats</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>Profile</h3>
            <p>Manage your account settings</p>
            <button className="card-button" onClick={() => navigate(`/user/${user?.username}`)}>View Profile</button>
          </div>

          {user?.roles?.includes('admin') && (
            <div className="dashboard-card admin-card">
              <div className="card-icon">⚙️</div>
              <h3>Admin Panel</h3>
              <p>Manage questions and users</p>
              <button className="card-button" onClick={() => navigate('/admin')}>Open Admin Panel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;




