import axios from "axios";
import React, { useEffect } from "react";
import useAuth from "./useAuth";
import { useNavigate } from "react-router";

const axiosSecure = axios.create({
  baseURL: `http://localhost:3000`,
  
});

const useAxiosSecure = () => {
  const { user, logOut } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    
    // 🔹 Request interceptor (add Firebase token)
    const requestInterceptor = axiosSecure.interceptors.request.use(
      async (config) => {
        if (user) {
          const token = await user.getIdToken(); // ✅ always get fresh token
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );




    // 🔹 Response interceptor (handle 401/403 errors)
    const responseInterceptor = axiosSecure.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        console.log("inside res interceptor", status);

        if (status === 403) {
          navigate("/forbidden");
        } else if (status === 401) {
          logOut()
            .then(() => navigate("/login"))
            .catch((err) => console.log("error from interceptor", err));
        }

        return Promise.reject(error); // ✅ reject properly
      }
    );

    // Cleanup to prevent multiple interceptors
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [user, logOut, navigate]);

  return axiosSecure;
};

export default useAxiosSecure;
