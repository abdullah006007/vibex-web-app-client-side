// useAxiosSecure.jsx
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuth from './useAuth';

const axiosSecure = axios.create({
  baseURL: 'http://localhost:3000', // Confirmed correct port
});

const useAxiosSecure = () => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Request interceptor (add Firebase token)
    const requestInterceptor = axiosSecure.interceptors.request.use(
      async (config) => {
        if (user) {
          try {
            const token = await user.getIdToken(true); // Force refresh token
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              console.log('useAxiosSecure: Attached token to request', { url: config.url, token: token.substring(0, 10) + '...' });
            } else {
              console.error('useAxiosSecure: No token available for user', user.uid);
            }
          } catch (error) {
            console.error('useAxiosSecure: Error fetching token', error);
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
      (error) => {
        const status = error?.response?.status;
        console.log('useAxiosSecure: Response interceptor caught error', { status, url: error.config?.url });

        if (status === 403) {
          navigate('/forbidden');
        } else if (status === 401) {
          console.log('useAxiosSecure: 401 Unauthorized, logging out');
          logOut()
            .then(() => navigate('/login'))
            .catch((err) => console.error('useAxiosSecure: Error during logout', err));
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