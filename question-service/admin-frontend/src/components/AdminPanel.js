import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import './AdminPanel.css';

const QUESTION_SERVICE_URL = process.env.REACT_APP_QUESTION_SERVICE_URL || 'http://localhost:4000';

function AdminPanel({ token, user, onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${QUESTION_SERVICE_URL}/questions`);
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
      await axios.delete(`${QUESTION_SERVICE_URL}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question deleted successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired! Please logout and login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete question');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎯 Question Admin Panel</h1>
            <p>Welcome, <strong>{user?.username}</strong></p>
          </div>
          <button onClick={onLogout} className="logout-button">
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

export default AdminPanel;

