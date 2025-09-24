import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import SocialLogin from './SocialLogin/SocialLogin';
import useAuth from '../../Hooks/useAuth';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { ToastContainer } from 'react-toastify';

const LogIn = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm();
  const navigate = useNavigate()
  const { signIn, resetPassword } = useAuth(); // Ensure useAuth returns login and resetPassword
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission for login
  const onSubmit = async (data) => {
    if (!signIn || typeof signIn !== 'function') {
      toast.error('Login functionality is not available. Please check your authentication setup.');
      console.error('Error: login is not a function. Check useAuth hook implementation.');
      return;
      
    }

    setIsLoading(true);
    try {
      await signIn(data.email, data.password);

      navigate('/')
      
      toast.success('Login successful!', {
        position: 'top-right', // Ensure notification appears in navbar or desired position
      });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.', {
        position: 'top-right',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Please enter an email to reset password', {
        position: 'top-right',
      });
      return;
    }

    if (!resetPassword || typeof resetPassword !== 'function') {
      toast.error('Password reset functionality is not available.', {
        position: 'top-right',
      });
      console.error('Error: resetPassword is not a function. Check useAuth hook implementation.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent! Check your inbox.', {
        position: 'top-right',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email.', {
        position: 'top-right',
      });
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex md:w-2xl items-center justify-center py-20 ">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold  text-center text-gray-500 mb-6">
         Please Log In
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className={`w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleResetPassword}
            className="text-sm text-indigo-600 hover:underline focus:outline-none"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-6">
          <SocialLogin />
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LogIn;