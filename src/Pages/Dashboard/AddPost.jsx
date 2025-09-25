import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import useAuth from '../../Hooks/useAuth';
import { useNavigate } from 'react-router';
import { FaUpload, FaTrash, FaCropAlt } from 'react-icons/fa';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Modal from 'react-modal';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { useQuery } from '@tanstack/react-query';

Modal.setAppElement('#root'); // Set the app element for accessibility

const AddPost = () => {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();
    const { displayName, email, photoURL, uid } = user || {};
    const navigate = useNavigate();
    const [postCount, setPostCount] = useState(null);
    const [formData, setFormData] = useState({
        authorImage: photoURL || 'https://via.placeholder.com/150?text=Default', // Fallback image
        authorName: displayName || '',
        authorEmail: email || '',
        postTitle: '',
        postDescription: '',
        postPhoto: '',
        tag: '',
        upVote: 0,
        downVote: 0,
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // State for upload progress
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const cropperRef = useRef(null);

    // Fetch available tags from API
    const { data: tagOptions = [], isLoading: tagsLoading } = useQuery({
        queryKey: ['tags'],
        queryFn: async () => {
            const response = await axiosSecure.get('/tags');
            // Transform API response to react-select format
            return response.data.map(tag => ({
                value: tag.toLowerCase(),
                label: tag.charAt(0).toUpperCase() + tag.slice(1)
            }));
        },
    });

    // Fetch user's post count
    useEffect(() => {
        const fetchPostCount = async () => {
            try {
                const response = await axiosSecure.get(`/user/post/count/${uid}`);
                setPostCount(response.data.count);
            } catch (error) {
                console.error('Error fetching post count:', error.response?.data || error.message);
                setPostCount(0);
            }
        };
        if (uid) {
            fetchPostCount();
        }
    }, [uid, axiosSecure]);


    const { data: userRoleData, isLoading: roleLoading } = useQuery({
        queryKey: ['userSubscription', email],
        queryFn: async () => {
            if (!email) return null;
            const response = await axiosSecure.get(`/users/role/${email}`);
        
            return response.data;
        },
        enabled: !!email && !authLoading,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTagChange = (selectedOption) => {
        setFormData((prev) => ({ ...prev, tag: selectedOption ? selectedOption.value : '' }));
    };


    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(URL.createObjectURL(file));
            setCropModalOpen(true);
        }
    };

    const handleCropAndUpload = async () => {
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            cropper.getCroppedCanvas().toBlob(async (blob) => {
                if (!blob) {
                    setError('Failed to crop image. Please try again.');
                    return;
                }

                setUploading(true);
                setUploadProgress(0); 
                setCropModalOpen(false);

                try {
                    const imageUploadUrl = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_image_upload_key}`;
                    const uploadFormData = new FormData();
                    uploadFormData.append('image', blob, 'cropped_image.jpg');

                    // Use XMLHttpRequest for better progress tracking
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', imageUploadUrl, true);

                    // Track upload progress
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentCompleted = Math.round((event.loaded * 100) / event.total);
                            setUploadProgress(percentCompleted);
                        }
                    };

                    // Handle upload completion
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                setFormData((prev) => ({ ...prev, postPhoto: response.data.url }));
                            } else {
                                throw new Error(response.error?.message || 'Upload failed');
                            }
                        } else {
                            throw new Error(`Upload failed with status ${xhr.status}`);
                        }
                        setUploading(false);
                        setUploadProgress(0);
                        setSelectedFile(null);
                    };

                    // Handle upload errors
                    xhr.onerror = () => {
                        setError('Failed to upload photo: Network error. Please try again.');
                        setUploading(false);
                        setUploadProgress(0);
                        setSelectedFile(null);
                    };

                    xhr.send(uploadFormData);
                } catch (error) {
                    console.error('Error uploading photo:', error.message);
                    setError(`Failed to upload photo: ${error.message}. Please check your network or API key and try again.`);
                    setUploading(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                }
            }, 'image/jpeg');
        }
    };

    // Handle delete photo
    const handleDeletePhoto = () => {
        setFormData((prev) => ({ ...prev, postPhoto: '' }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate required fields
        if (!formData.postTitle || !formData.postDescription || !formData.tag) {
            setError('Please fill in all required fields: Title, Description, and Tag.');
            return;
        }

        try {
            const postData = {
                ...formData,
                userId: uid,
                createdAt: new Date().toISOString(),
            };
  
            const response = await axiosSecure.post(`/user/post/${uid}`, postData);
            console.log('Server Response:', response.data); // Log response for debugging
            setFormData({
                ...formData,
                postTitle: '',
                postDescription: '',
                postPhoto: '',
                tag: '',
            });
            alert('Post created successfully!');
            navigate('/dashboard/home'); // Redirect to dashboard after submission
        } catch (error) {
            console.error('Error creating post:', error);
            const errorMessage = error.response
                ? error.response.data?.error || 'Server error. Please try again.'
                : 'Network error. Please check if the server is running and try again.';
            setError(`Failed to create post: ${errorMessage}`);
        }
    };

    // Handle Become a Member button click
    const handleBecomeMember = () => {
        navigate('/membership');
    };

    // Handle image load error
    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/150?text=Error'; // Fallback for invalid image URLs
    };

    // Show loading state while fetching post count, subscription, or tags
    if (postCount === null || roleLoading || authLoading || tagsLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-600 text-lg">Loading...</p>
            </div>
        );
    }

    // Show Become a Member button if post count exceeds 5 AND user is not premium/admin
    if (postCount >= 5 && userRoleData?.subscription !== 'premium' && userRoleData?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
                <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Post Limit Reached</h1>
                    <p className="text-gray-600 mb-6 text-lg">
                        You've reached the maximum of 5 posts. Become a Premium member to post more!
                    </p>
                    <button
                        onClick={handleBecomeMember}
                        className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 text-lg font-semibold"
                    >
                        Become a Premium Member
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Add New Post</h1>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Author Image URL</label>
                        <input
                            type="text"
                            name="authorImage"
                            value={formData.authorImage}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Enter author image URL"
                            readOnly
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Author Name</label>
                        <input
                            type="text"
                            name="authorName"
                            value={formData.authorName}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Author Email</label>
                        <input
                            type="email"
                            name="authorEmail"
                            value={formData.authorEmail}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Post Title</label>
                        <input
                            type="text"
                            name="postTitle"
                            value={formData.postTitle}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Enter post title"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Post Description</label>
                        <textarea
                            name="postDescription"
                            value={formData.postDescription}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            rows="5"
                            placeholder="Enter post description"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Post Photo</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="postPhoto"
                            />
                            <label
                                htmlFor="postPhoto"
                                className="flex items-center justify-center w-full p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors duration-300"
                            >
                                <FaUpload className="text-blue-600 mr-2" />
                                <span className="text-gray-700 font-medium">
                                    {uploading ? `Uploading... (${uploadProgress}%)` : formData.postPhoto ? 'Change Photo' : 'Upload Photo'}
                                </span>
                            </label>
                            {uploading && (
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                            {formData.postPhoto && (
                                <div className="mt-4 flex flex-col items-center">
                                    <p className="text-gray-600 mb-2">Uploaded Photo Preview:</p>
                                    <div className="flex items-center">
                                        <img
                                            src={formData.postPhoto}
                                            alt="Post Preview"
                                            className="w-64 h-64 object-cover rounded-lg shadow-md"
                                            onError={handleImageError}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleDeletePhoto}
                                            className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                                            title="Delete Photo"
                                        >
                                            <FaTrash size={24} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Tag</label>
                        <Select
                            options={tagOptions}
                            value={tagOptions.find((option) => option.value === formData.tag)}
                            onChange={handleTagChange}
                            className="w-full"
                            placeholder="Select a tag"
                            isClearable
                            isLoading={tagsLoading}
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-gray-700 font-medium mb-2">UpVote</label>
                            <input
                                type="number"
                                name="upVote"
                                value={formData.upVote}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                                readOnly
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-gray-700 font-medium mb-2">DownVote</label>
                            <input
                                type="number"
                                name="downVote"
                                value={formData.downVote}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                                readOnly
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full p-3 rounded-lg text-white font-semibold transition-colors duration-300 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        Submit Post
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Crop Your Photo</h2>
                {selectedFile && (
                    <Cropper
                        src={selectedFile}
                        style={{ height: 400, width: '100%' }}
                        initialAspectRatio={1}
                        guides={true}
                        ref={cropperRef}
                        viewMode={1}
                        minCropBoxHeight={10}
                        minCropBoxWidth={10}
                        background={false}
                        responsive={true}
                        autoCropArea={1}
                        checkOrientation={false}
                    />
                )}
                <div className="mt-4 flex justify-end gap-4">
                    <button
                        onClick={() => setCropModalOpen(false)}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCropAndUpload}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <FaCropAlt className="mr-2" />
                        Crop & Upload
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AddPost;