import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuth from '../../Hooks/useAuth';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { FaUpload, FaTrash, FaCropAlt, FaUser } from 'react-icons/fa';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Set the app element for accessibility

const UpdateProfile = () => {
    const { user, updateUserProfile } = useAuth();
    const axiosSecure = useAxiosSecure();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [fetchingUserData, setFetchingUserData] = useState(true);
    const cropperRef = useRef(null);

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setFetchingUserData(true);
                const response = await axiosSecure.get(`/users/role/${user?.email}`);
                console.log('User role data:', response.data);

                // Set profile picture with priority: API data -> Firebase user -> placeholder
                const apiPhotoURL = response.data.photoURL;
                const firebasePhotoURL = user?.photoURL;
                setProfilePic(apiPhotoURL || firebasePhotoURL || '');

                // Pre-fill form values
                setValue('name', response.data.name || user?.displayName || '');
                setValue('phone', response.data.phone || '');
                setValue('address', response.data.address || '');
                setValue('bio', response.data.bio || '');
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Fallback to Firebase user data
                setProfilePic(user?.photoURL || '');
                setValue('name', user?.displayName || '');
                setValue('bio', '');
                toast.error('Could not load profile data. Using cached information.');
            } finally {
                setFetchingUserData(false);
            }
        };

        if (user?.email) {
            fetchUserData();
        } else {
            setFetchingUserData(false);
        }
    }, [user, axiosSecure, setValue]);

    // Handle file selection for cropping
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(file.type)) {
            toast.error('Please select a JPEG, PNG, or GIF image');
            return;
        }

        setSelectedFile(URL.createObjectURL(file));
        setCropModalOpen(true);
    };

    // Handle crop and upload
    const handleCropAndUpload = async () => {
        if (!cropperRef.current) {
            toast.error('Failed to initialize cropper');
            return;
        }

        const cropper = cropperRef.current.cropper;
        cropper.getCroppedCanvas().toBlob(async (blob) => {
            if (!blob) {
                toast.error('Failed to crop image. Please try again.');
                return;
            }

            setImageUploading(true);
            setUploadProgress(0);
            setCropModalOpen(false);

            try {
                const imageUploadUrl = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_image_upload_key}`;
                const uploadFormData = new FormData();
                uploadFormData.append('image', blob, 'profile_picture.jpg');

                const xhr = new XMLHttpRequest();
                xhr.open('POST', imageUploadUrl, true);

                // Track upload progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentCompleted = Math.round((event.loaded * 100) / event.total);
                        setUploadProgress(percentCompleted);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            setProfilePic(response.data.url);
                            toast.success('Profile picture uploaded successfully');
                        } else {
                            throw new Error(response.error?.message || 'Upload failed');
                        }
                    } else {
                        throw new Error(`Upload failed with status ${xhr.status}`);
                    }
                    setImageUploading(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                };

                xhr.onerror = () => {
                    toast.error('Failed to upload photo: Network error');
                    setImageUploading(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                };

                xhr.send(uploadFormData);
            } catch (error) {
                console.error('Error uploading photo:', error.message);
                toast.error(`Failed to upload photo: ${error.message}`);
                setImageUploading(false);
                setUploadProgress(0);
                setSelectedFile(null);
            }
        }, 'image/jpeg');
    };

    // Handle delete photo
    const handleDeletePhoto = () => {
        setProfilePic('');
        toast.success('Profile picture removed');
    };

    // Handle form submission
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Update Firebase profile if name or photo changed
            if (data.name !== user.displayName || profilePic !== user.photoURL) {
                console.log('Updating Firebase profile:', { displayName: data.name, photoURL: profilePic });
                await updateUserProfile({
                    displayName: data.name,
                    photoURL: profilePic || 'https://placehold.co/150?text=User'
                });
            }

            // Update MongoDB user data
            const updates = {
                name: data.name,
                phone: data.phone || null,
                address: data.address || null,
                bio: data.bio || null,
                photoURL: profilePic || null
            };
            console.log('Sending update to MongoDB:', { email: user.email, updates });
            const response = await axiosSecure.put('/users/update', {
                email: user.email,
                updates
            });

            console.log('MongoDB update response:', response.data);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle image load error
    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    if (fetchingUserData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Update Profile</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-100 shadow-md flex items-center justify-center bg-gray-100">
                                {profilePic ? (
                                    <>
                                        <img
                                            src={profilePic}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={handleImageError}
                                        />
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-gray-200"
                                            style={{ display: 'none' }}
                                        >
                                            <FaUser className="text-gray-400 text-4xl" />
                                        </div>
                                    </>
                                ) : (
                                    <FaUser className="text-gray-400 text-4xl" />
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 flex gap-2">
                                <label className="bg-indigo-600 text-white p-3 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={imageUploading}
                                    />
                                    {imageUploading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <FaUpload className="h-5 w-5" />
                                    )}
                                </label>
                                {profilePic && (
                                    <button
                                        type="button"
                                        onClick={handleDeletePhoto}
                                        className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-md"
                                        disabled={imageUploading}
                                    >
                                        <FaTrash className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {imageUploading && (
                            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                                <p className="text-center text-sm text-gray-600 mt-1">
                                    Uploading... {uploadProgress}%
                                </p>
                            </div>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            Upload a JPEG, PNG, or GIF image (max 5MB)
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
                        <input
                            type="text"
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 2, message: 'Name must be at least 2 characters' }
                            })}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                            placeholder="Enter your full name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-2">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Bio</label>
                        <textarea
                            {...register('bio', {
                                maxLength: { value: 150, message: 'Bio must be 150 characters or less' }
                            })}
                            rows={3}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                            placeholder="Write a short bio (max 150 characters)"
                        />
                        {errors.bio && (
                            <p className="text-red-500 text-sm mt-2">{errors.bio.message}</p>
                        )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                        <input
                            type="tel"
                            {...register('phone', {
                                pattern: {
                                    value: /^\+?[1-9]\d{1,14}$/,
                                    message: 'Enter a valid phone number (e.g., +8801234567890)'
                                }
                            })}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                            placeholder="+8801234567890"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-2">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Address</label>
                        <textarea
                            {...register('address')}
                            rows={3}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                            placeholder="Enter your address"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || imageUploading}
                        className={`w-full p-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
                            loading || imageUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {loading ? 'Updating Profile...' : imageUploading ? 'Uploading Image...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            {/* Crop Modal */}
            <Modal
                isOpen={cropModalOpen}
                onRequestClose={() => setCropModalOpen(false)}
                contentLabel="Crop Image"
                className="max-w-lg mx-auto mt-20 bg-white rounded-lg shadow-xl p-6"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Crop Your Profile Photo</h2>
                <p className="text-gray-600 mb-4">Adjust the cropping area to your preference</p>
                {selectedFile && (
                    <Cropper
                        src={selectedFile}
                        style={{ height: 400, width: '100%' }}
                        initialAspectRatio={1}
                        guides={true}
                        ref={cropperRef}
                        viewMode={1}
                        minCropBoxHeight={50}
                        minCropBoxWidth={50}
                        background={false}
                        responsive={true}
                        autoCropArea={1}
                        checkOrientation={false}
                    />
                )}
                <div className="mt-4 flex justify-end gap-4">
                    <button
                        onClick={() => {
                            setCropModalOpen(false);
                            setSelectedFile(null);
                        }}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCropAndUpload}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                        disabled={imageUploading}
                    >
                        <FaCropAlt className="mr-2" />
                        {imageUploading ? 'Uploading...' : 'Crop & Upload'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default UpdateProfile;