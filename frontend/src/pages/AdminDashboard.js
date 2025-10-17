import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import QuestionForm from '../components/admin/QuestionForm';
import QuestionList from '../components/admin/QuestionList';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  
  const user = authService.getCurrentUser();
  const token = authService.getAccessToken();

  useEffect(() => {
    // Verify admin access
    if (!user?.roles?.includes('admin')) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }
    fetchQuestions();
  }, [user, navigate]);

  const fetchQuestions = async () => {
    try {
      const response = await apiClient.get('/questions');
      setQuestions(response.data);
      calculateStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      setLoading(false);
    }
  };

  const calculateStats = (questionList) => {
    const stats = {
      total: questionList.length,
      easy: questionList.filter(q => q.difficulty === 'easy').length,
      medium: questionList.filter(q => q.difficulty === 'medium').length,
      hard: questionList.filter(q => q.difficulty === 'hard').length
    };
    setStats(stats);
  };

  const handleQuestionSaved = () => {
    fetchQuestions();
    setEditingQuestion(null);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await apiClient.delete(`/questions/${questionId}`);
      toast.success('Question deleted successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete question';
      toast.error(errorMsg);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully!');
    navigate('/auth');
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎯 Question Admin Panel</h1>
            <p>Welcome, <strong>{user?.username}</strong></p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-card easy">
          <div className="stat-value">{stats.easy}</div>
          <div className="stat-label">Easy</div>
        </div>
        <div className="stat-card medium">
          <div className="stat-value">{stats.medium}</div>
          <div className="stat-label">Medium</div>
        </div>
        <div className="stat-card hard">
          <div className="stat-value">{stats.hard}</div>
          <div className="stat-label">Hard</div>
        </div>
      </div>

      <div className="admin-content">
        <QuestionForm 
          token={token}
          editingQuestion={editingQuestion}
          onQuestionSaved={handleQuestionSaved}
          onCancel={handleCancelEdit}
        />
        
        <QuestionList
          questions={questions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;

