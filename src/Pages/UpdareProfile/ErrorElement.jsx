// ErrorElement.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

const ErrorElement = ({ error }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract error details from props or location state (e.g., passed by React Router)
  const errorMessage = error?.message || location.state?.errorMessage || 'An unexpected error occurred';
  const errorCode = error?.code || location.state?.errorCode || 'UNKNOWN';
  const isAuthError = errorCode.includes('auth/') || [401, 403].includes(error?.response?.status);

  // Customize message based on error type
  let displayMessage;
  let actionText = 'Back to Home';
  let actionIcon = <FaHome className="mr-2" />;
  let actionHandler = () => navigate('/');

  switch (errorCode) {
    case 'auth/quota-exceeded':
      displayMessage = 'Too many requests to the server. Please try again later.';
      actionText = 'Retry';
      actionIcon = <FaRedo className="mr-2" />;
      actionHandler = () => window.location.reload();
      break;
    case '401':
    case '403':
      displayMessage = 'You are not authorized to access this page. Please log in or check your permissions.';
      actionText = 'Go to Login';
      actionHandler = () => navigate('/login');
      break;
    case '404':
      displayMessage = 'The page you are looking for does not exist.';
      break;
    default:
      displayMessage = errorMessage.includes('Objects are not valid as a React child')
        ? 'There was an issue rendering the page. Please try again or contact support.'
        : errorMessage;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {isAuthError ? 'Access Denied' : 'Something Went Wrong'}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 mb-6">{displayMessage}</p>

        {/* Error Code (for debugging) */}
        <p className="text-sm text-gray-500 mb-8">
          Error Code: <span className="font-mono">{errorCode}</span>
        </p>

        {/* Action Button */}
        <button
          onClick={actionHandler}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {actionIcon}
          {actionText}
        </button>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          Need help?{' '}
          <a
            href="mailto:support@example.com"
            className="text-indigo-600 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ErrorElement;