import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './QuestionList.css';

function QuestionList({ questions, loading, onEdit, onDelete }) {
  const [filter, setFilter] = useState({ difficulty: 'all', topic: '' });
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const filteredQuestions = questions.filter(q => {
    const matchesDifficulty = filter.difficulty === 'all' || q.difficulty === filter.difficulty;
    const matchesTopic = !filter.topic || q.topic.toLowerCase().includes(filter.topic.toLowerCase());
    return matchesDifficulty && matchesTopic;
  });

  const topics = [...new Set(questions.map(q => q.topic))];

  if (loading) {
    return (
      <div className="question-list-card">
        <div className="loading">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="question-list-card">
      <div className="list-header">
        <h2>📚 All Questions ({filteredQuestions.length})</h2>
        <div className="filters">
          <select
            value={filter.difficulty}
            onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <input
            type="text"
            placeholder="Filter by topic..."
            value={filter.topic}
            onChange={(e) => setFilter({ ...filter, topic: e.target.value })}
            className="filter-input"
          />
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="empty-state">
          <p>No questions found. Create your first question!</p>
        </div>
      ) : (
        <div className="questions-grid">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <div>
                  <h3>{question.title}</h3>
                  <div className="question-meta">
                    <span className={`difficulty-badge ${question.difficulty}`}>
                      {question.difficulty}
                    </span>
                    <span className="topic-badge">{question.topic}</span>
                  </div>
                </div>
              </div>

              <div className="question-description">
                {expandedQuestion === question.id ? (
                  <ReactMarkdown>{question.description}</ReactMarkdown>
                ) : (
                  <p>{question.description.substring(0, 150)}...</p>
                )}
              </div>

              <button
                onClick={() => setExpandedQuestion(
                  expandedQuestion === question.id ? null : question.id
                )}
                className="expand-button"
              >
                {expandedQuestion === question.id ? 'Show Less' : 'Show More'}
              </button>

              <div className="question-actions">
                <button onClick={() => onEdit(question)} className="edit-button">
                  ✏️ Edit
                </button>
                <button onClick={() => onDelete(question.id)} className="delete-button">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionList;




