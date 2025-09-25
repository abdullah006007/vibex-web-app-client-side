import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';

import useAuth from '../../Hooks/useAuth';
import SocialLogin from '../../Component/Authentication/SocialLogin/SocialLogin';

const JoinUs = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { user,signIn, setUser, setLoading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission for email/password login
  const onSubmit = async (data) => {
    if (!signIn || typeof signIn !== 'function') {
      toast.error('Login functionality is not available. Please check your authentication setup.');
      console.error('Error: signIn is not a function. Check useAuth hook implementation.');
      return;
    }

    if(user){
        toast.error('Already Logged In');
        navigate('/')
        return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google login


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .form-container {
            animation: fadeIn 0.5s ease-out;
          }
        `}
      </style>
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md form-container">
        <h2 className="text-2xl font-bold text-center text-gray-500 mb-6">Join Us</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className={`w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-200 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </div>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
         <SocialLogin></SocialLogin>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default JoinUs;