// useAxiosSecure.jsx
import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import useAuth from './useAuth';

const axiosSecure = axios.create({
  baseURL: 'https://server-side-iota-five.vercel.app', // Confirmed correct port
});

const useAxiosSecure = () => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const tokenCache = useRef({ token: null, expiry: null }); // Store token and expiry

  useEffect(() => {
    // Request interceptor (add Firebase token)
    const requestInterceptor = axiosSecure.interceptors.request.use(
      async (config) => {
        if (user) {
          try {
            const now = Date.now();
            // Check if cached token is valid (not expired)
            if (
              tokenCache.current.token &&
              tokenCache.current.expiry &&
              now < tokenCache.current.expiry
            ) {
              config.headers.Authorization = `Bearer ${tokenCache.current.token}`;
             
              return config;
            }

            // Fetch new token
            const token = await user.getIdToken(false); // Avoid forced refresh
            if (token) {
              // Decode token to get expiry (Firebase tokens are valid for 1 hour)
              const decodedToken = JSON.parse(atob(token.split('.')[1]));
              const expiry = decodedToken.exp * 1000; // Convert to milliseconds
              tokenCache.current = { token, expiry };
              config.headers.Authorization = `Bearer ${token}`;
              
            } else {
              console.error('useAxiosSecure: No token available for user', user.uid);
            }
          } catch (error) {
            console.error('useAxiosSecure: Error fetching token', {
              message: error.message,
              code: error.code,
            });
            if (error.code === 'auth/quota-exceeded') {
              console.warn('useAxiosSecure: Token quota exceeded, retrying later');
              // Optionally delay and retry (see Step 3)
            }
          }
        } else {
          console.warn('useAxiosSecure: No authenticated user');
        }
        return config;
      },
      (error) => {
        console.error('useAxiosSecure: Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor (handle 401/403 errors)
    const responseInterceptor = axiosSecure.interceptors.response.use(
      (res) => res,
      async (error) => {
        const status = error?.response?.status;

        if (status === 403) {
          navigate('/forbidden');
        } else if (status === 401) {
        
          try {
            await logOut();
            navigate('/login');
          } catch (err) {
            console.error('useAxiosSecure: Error during logout', err);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [user, logOut, navigate]);

  return axiosSecure;
};

export default useAxiosSecure;