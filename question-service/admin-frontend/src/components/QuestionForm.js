import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './QuestionForm.css';

const QUESTION_SERVICE_URL = process.env.REACT_APP_QUESTION_SERVICE_URL || 'http://localhost:4000';

function QuestionForm({ token, editingQuestion, onQuestionSaved, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    topic: '',
    test_cases: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingQuestion) {
      // Extract image URL from description if exists
      const imgMatch = editingQuestion.description.match(/!\[.*?\]\((.*?)\)/);
      let cleanDescription = editingQuestion.description;
      
      if (imgMatch) {
        setImagePreview(imgMatch[1]);
        // Remove the image markdown from description
        cleanDescription = editingQuestion.description.replace(/\n*!\[.*?\]\(.*?\)\n*/g, '').trim();
      }
      
      setFormData({
        title: editingQuestion.title,
        description: cleanDescription,
        difficulty: editingQuestion.difficulty,
        topic: editingQuestion.topic,
        test_cases: JSON.stringify(editingQuestion.test_cases, null, 2)
      });
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
      test_cases: ''
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
      // Get signature from backend
      const sigResponse = await axios.get(`${QUESTION_SERVICE_URL}/questions/signature`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { timestamp, signature, cloud_name, api_key } = sigResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', api_key);

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData
      );

      setUploading(false);
      return uploadResponse.data.secure_url;
    } catch (error) {
      setUploading(false);
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
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
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary();
      } else if (imagePreview) {
        // Keep existing image URL
        imageUrl = imagePreview;
      }

      // Prepare description with image
      let description = formData.description;
      if (imageUrl) {
        // Always append image at the end
        description = `${formData.description}\n\n![Question Image](${imageUrl})`;
      }

      const questionData = {
        title: formData.title,
        description: description,
        difficulty: formData.difficulty,
        topic: formData.topic,
        test_cases: testCases
      };

      if (editingQuestion) {
        // Update
        await axios.put(
          `${QUESTION_SERVICE_URL}/questions/${editingQuestion.id}`,
          questionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question updated successfully!');
      } else {
        // Create
        await axios.post(
          `${QUESTION_SERVICE_URL}/questions`,
          questionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question created successfully!');
      }

      resetForm();
      onQuestionSaved();
    } catch (error) {
      console.error('Error saving question:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired! Please logout and login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save question');
      }
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
          <label>Test Cases * (JSON format)</label>
          <textarea
            value={formData.test_cases}
            onChange={(e) => setFormData({ ...formData, test_cases: e.target.value })}
            placeholder='{"cases": [{"input": [2, 7, 11, 15], "target": 9, "expected": [0, 1]}]}'
            rows="4"
            required
            className="code-input"
          />
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

