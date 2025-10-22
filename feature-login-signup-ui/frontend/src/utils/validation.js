// ============================================
// FRONTEND VALIDATION UTILITIES
// ============================================

/**
 * Validates login form data
 * @param {Object} formData - The login form data
 * @param {string} formData.identifier - Email or username
 * @param {string} formData.password - Password
 * @returns {Object} Validation result with isValid boolean and errors object
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.identifier?.trim()) {
    errors.identifier = 'Email or username is required';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates signup form data
 * @param {Object} formData - The signup form data
 * @param {string} formData.username - Username
 * @param {string} formData.email - Email address
 * @param {string} formData.password - Password
 * @param {string} formData.confirmPassword - Confirm password
 * @returns {Object} Validation result with isValid boolean and errors object
 */
export const validateSignupForm = (formData) => {
  const errors = {};
  
  // Username validation
  if (!formData.username?.trim()) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  
  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';
  }
  
  // Confirm password validation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates reset password form data
 * @param {Object} formData - The reset password form data
 * @param {string} formData.newPassword - New password
 * @param {string} formData.confirmNewPassword - Confirm new password
 * @returns {Object} Validation result with isValid boolean and errors object
 */
export const validateResetPasswordForm = (formData) => {
  const errors = {};
  
  if (!formData.newPassword) {
    errors.newPassword = 'Password is required';
  } else if (!validatePassword(formData.newPassword)) {
    errors.newPassword = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';
  }
  
  if (formData.newPassword !== formData.confirmNewPassword) {
    errors.confirmNewPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates forgot password form (email only)
 * @param {string} email - Email address
 * @returns {Object} Validation result with isValid boolean and optional message
 */
export const validateForgotPasswordForm = (email) => {
  if (!email?.trim()) {
    return {
      isValid: false,
      message: 'Please enter your email address'
    };
  }
  
  if (!validateEmail(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address'
    };
  }
  
  return {
    isValid: true
  };
};

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password) => {
  return password.length >= 12 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /\d/.test(password) &&
         /[^A-Za-z0-9]/.test(password);
};

/**
 * Gets password strength requirements for UI display
 * @param {string} password - Current password
 * @returns {Object} Requirements object with boolean values
 */
export const getPasswordRequirements = (password) => {
  return {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password)
  };
};

/**
 * Gets user-friendly error messages for login errors
 * @param {Error} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export const getLoginErrorMessage = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  const status = error.response.status;
  const errorData = error.response.data;
  
  if (errorData?.message) {
    return errorData.message;
  }
  
  switch (status) {
    case 401:
      return 'Invalid email/username or password.';
    case 403:
      return 'Account is locked or suspended.';
    case 429:
      return 'Too many login attempts. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'Login failed. Please try again.';
  }
};

/**
 * Gets user-friendly error messages for signup errors
 * @param {Error} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export const getSignupErrorMessage = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  const status = error.response.status;
  const errorData = error.response.data;
  
  if (errorData?.message) {
    return errorData.message;
  }
  
  switch (status) {
    case 400:
      return 'Invalid registration data provided.';
    case 409:
      return 'Email or username already exists.';
    case 422:
      return 'Registration data does not meet requirements.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'Registration failed. Please try again.';
  }
};

/**
 * Gets user-friendly error messages for password reset errors
 * @param {Error} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export const getPasswordResetErrorMessage = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  const status = error.response.status;
  const errorData = error.response.data;
  
  if (errorData?.message) {
    return errorData.message;
  }
  
  switch (status) {
    case 400:
      return 'Invalid password format or passwords do not match.';
    case 401:
      return 'Reset link has expired or is invalid. Please request a new password reset.';
    case 403:
      return 'You are not authorized to reset this password.';
    case 422:
      return 'Password does not meet security requirements.';
    case 500:
      return 'Server error occurred. Please try again later.';
    default:
      return 'Password reset failed. Please try again.';
  }
};