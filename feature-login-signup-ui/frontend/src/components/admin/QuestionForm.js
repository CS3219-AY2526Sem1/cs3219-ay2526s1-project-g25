import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import './QuestionForm.css';

function QuestionForm({ editingQuestion, onQuestionSaved, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    topic: '',
    test_cases: '{\n  "cases": [\n    {\n      "input": "3 5",\n      "output": "8"\n    },\n    {\n      "input": "10 20",\n      "output": "30"\n    }\n  ]\n}',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        title: editingQuestion.title,
        description: editingQuestion.description,
        difficulty: editingQuestion.difficulty,
        topic: editingQuestion.topic,
        test_cases: JSON.stringify(editingQuestion.test_cases, null, 2),
        image_url: editingQuestion.image_url || ''
      });
      
      // Set image preview if image_url exists
      if (editingQuestion.image_url) {
        setImagePreview(editingQuestion.image_url);
      }
    } else {
      resetForm();
    }
  }, [editingQuestion]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      topic: '',
      test_cases: '{\n  "cases": [\n    {\n      "input": "3 5",\n      "output": "8"\n    },\n    {\n      "input": "10 20",\n      "output": "30"\n    }\n  ]\n}',
      image_url: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      // Get signature from backend (apiClient automatically adds auth token)
      const sigResponse = await apiClient.get('/questions/signature');

      const { timestamp, signature, cloud_name, api_key } = sigResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', api_key);

      // Use fetch API for Cloudinary upload (completely bypasses axios configuration)
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: 'POST',
          body: formData,
          // No headers needed - fetch handles multipart/form-data automatically
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      setUploading(false);
      return uploadData.secure_url;
    } catch (error) {
      setUploading(false);
      console.error('Error uploading image:', error);
      const errorMsg = error.message || 'Failed to upload image';
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate test_cases JSON
      let testCases;
      try {
        testCases = JSON.parse(formData.test_cases);
      } catch (err) {
        toast.error('Invalid JSON in test cases');
        setSubmitting(false);
        return;
      }

      // Upload image if new one is selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      const questionData = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        topic: formData.topic,
        test_cases: testCases,
        image_url: imageUrl
      };

      if (editingQuestion) {
        // Update (apiClient automatically adds auth token)
        await apiClient.put(`/questions/${editingQuestion.id}`, questionData);
        toast.success('Question updated successfully!');
      } else {
        // Create (apiClient automatically adds auth token)
        await apiClient.post('/questions', questionData);
        toast.success('Question created successfully!');
      }

      resetForm();
      onQuestionSaved();
    } catch (error) {
      let errorMsg = 'Failed to save question';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.error && data.fields) {
          errorMsg = `${data.error}: ${data.fields.join(', ')}`;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="question-form-card">
      <h2>{editingQuestion ? '✏️ Edit Question' : '➕ Add New Question'}</h2>
      
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Two Sum"
              required
            />
          </div>

          <div className="form-group">
            <label>Topic *</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Arrays, Strings, Trees"
              required
            />
          </div>

          <div className="form-group">
            <label>Difficulty *</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              required
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description * (Markdown supported)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter question description..."
            rows="6"
            required
          />
        </div>

        <div className="form-group">
          <label>Question Image (Optional)</label>
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              id="image-input"
            />
            <label htmlFor="image-input" className="image-upload-label">
              {imageFile ? imageFile.name : 'Choose Image (Max 5MB)'}
            </label>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="remove-image"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Test Cases * (Kattis-style stdin/stdout format)</label>
          <textarea
            value={formData.test_cases}
            onChange={(e) => setFormData({ ...formData, test_cases: e.target.value })}
            placeholder='{"cases": [{"input": "3 5", "output": "8"}, {"input": "10 20", "output": "30"}]}'
            rows="6"
            required
            className="code-input"
          />
          <div className="text-sm text-gray-600 mt-1">
            <strong>Format:</strong> Each test case has "input" (stdin) and "output" (expected stdout). 
            <br />Example: Input "3 5" should produce output "8" for an addition problem.
          </div>
        </div>

        <div className="form-actions">
          {editingQuestion && (
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="submit-button"
            disabled={submitting || uploading}
          >
            {uploading ? '📤 Uploading Image...' : submitting ? 'Saving...' : editingQuestion ? '💾 Update Question' : '➕ Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuestionForm;

