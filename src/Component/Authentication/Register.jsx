import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuth from '../../Hooks/useAuth';
import { Link, useNavigate } from 'react-router';
import SocialLogin from './SocialLogin/SocialLogin';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAxios from '../../Hooks/useAxios';

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { createUser, updateUserProfile } = useAuth();
    const [profilePic, setProfilePic] = useState();
    const axiosInstance = useAxios();
    const navigate = useNavigate();
    const form = location.state?.form || '/';

    const onSubmit = (data) => {
        createUser(data.email, data.password)
            .then(async (result) => {
                
                // user info
                const userInfo = {
                    username: data.name,
                    email: data.email,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    last_log_in: new Date().toISOString(),
                };
                await axiosInstance.post('/users', userInfo);

                // update profile
                const userProfile = {
                    displayName: data.name,
                    photoUrl: profilePic,
                };

                updateUserProfile(userProfile)
                    .then(() => {
                        console.log('Profile updated');
                    })
                    .catch((error) => console.log(error));

                navigate(form);
                toast.success('Registered successfully!');
            })
            .catch((error) => {
                console.log(error);
                toast.error(error.message);
            });
    };

    const handleImageUpload = async (e) => {
        const image = e.target.files[0];
        const formData = new FormData();
        formData.append('image', image);

        const imageUploadUrl = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_image_upload_key}`;
        const res = await axios.post(imageUploadUrl, formData);
        setProfilePic(res.data.data.url);
    };

    return (
        <div className="flex items-center justify-center   px-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
                    Create an Account ✨
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    {/* Name */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            {...register('name', { required: true })}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="Enter your name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">Name is required</p>
                        )}
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Profile Picture</label>
                        <input
                            type="file"
                            onChange={handleImageUpload}
                            className="w-full text-sm border rounded-md px-2 py-1 cursor-pointer focus:outline-none"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            {...register('email', { required: true })}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="Enter your email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">Email is required</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: true, minLength: 6 })}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="Enter your password"
                        />
                        {errors.password?.type === 'required' && (
                            <p className="text-red-500 text-xs mt-1">Password is required</p>
                        )}
                        {errors.password?.type === 'minLength' && (
                            <p className="text-red-500 text-xs mt-1">
                                Password must be at least 6 characters
                            </p>
                        )}
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        Register
                    </button>
                </form>

                {/* Social Login */}
                <div className="mt-4">
                    <SocialLogin />
                </div>

                {/* Already have account */}
                <p className="text-center text-xs text-gray-600 mt-4">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
