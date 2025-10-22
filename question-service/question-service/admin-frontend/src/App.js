import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { Toaster } from 'react-hot-toast';

function App() {
  const [adminToken, setAdminToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    if (token && userData) {
      setAdminToken(token);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token, userData) => {
    setAdminToken(token);
    setUser(userData);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setAdminToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      {!adminToken ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AdminPanel token={adminToken} user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

