import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

function ProtectedRoute({ children, adminOnly = false }) {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAdmin = user?.roles?.includes('admin');

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If admin tries to access user dashboard, redirect to admin panel
  if (isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />;
  }

  // If regular user tries to access admin routes
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
