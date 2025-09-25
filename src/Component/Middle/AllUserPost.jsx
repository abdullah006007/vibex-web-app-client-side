import React, { useState, useMemo } from 'react';
import useAuth from '../../Hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { FaArrowUp, FaArrowDown, FaPaperPlane, FaRegComment, FaReply, FaShare } from 'react-icons/fa';
import Modal from 'react-modal';
import { FacebookShareButton, FacebookIcon } from 'react-share';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const AllUserPost = ({ userPost, isPending, error }) => {
    const { user, loading: authLoading } = useAuth();
    const { displayName, photoURL, email } = user || {};
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
     const [isModalOpen, setIsModalOpen] = useState(false);
    


    // State for modal, comment input, reply input, and comment sorting
    // const [isModalOpen, setIsModalOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [commentSort, setCommentSort] = useState('newest'); // New state for sorting comments


     // Define shareUrl and shareTitle for social sharing
    const shareUrl = window.location.href; // Current page URL or you can customize
    const shareTitle = userPost?.postTitle || 'Check out this post!';

    // Memoized sorted comments
    const sortedComments = useMemo(() => {
        if (!userPost?.comments) return [];
        let comments = [...userPost.comments];
        if (commentSort === 'newest') {
            return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (commentSort === 'popularity') {
            return comments.sort((a, b) => (b.upVote - b.downVote) - (a.upVote - a.downVote));
        }
        return comments;
    }, [userPost?.comments, commentSort]);

    // Upvote mutation for post
    const upvoteMutation = useMutation({
        mutationFn: async (postId) => {
            if (!user) throw new Error('You must be logged in to upvote.');
            const response = await axiosSecure.put(`/user/post/${postId}/upvote`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
        },
        onError: (error) => {
            console.error('Error upvoting post:', error);
            alert(error.response?.data?.message || error.message || 'Failed to upvote post. Please try again.');
        },
    });

    // Downvote mutation for post
    const downvoteMutation = useMutation({
        mutationFn: async (postId) => {
            if (!user) throw new Error('You must be logged in to downvote.');
            const response = await axiosSecure.put(`/user/post/${postId}/downvote`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
        },
        onError: (error) => {
            console.error('Error downvoting post:', error);
            alert(error.response?.data?.message || error.message || 'Failed to downvote post. Please try again.');
        },
    });

    // Comment upvote mutation
    const commentUpvoteMutation = useMutation({
        mutationFn: async ({ postId, commentId }) => {
            if (!user) throw new Error('You must be logged in to upvote.');
            const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/upvote`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
        },
        onError: (error) => {
            console.error('Error upvoting comment:', error);
            alert(error.response?.data?.message || error.message || 'Failed to upvote comment. Please try again.');
        },
    });

    // Comment downvote mutation
    const commentDownvoteMutation = useMutation({
        mutationFn: async ({ postId, commentId }) => {
            if (!user) throw new Error('You must be logged in to downvote.');
            const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/downvote`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
        },
        onError: (error) => {
            console.error('Error downvoting comment:', error);
            alert(error.response?.data?.message || error.message || 'Failed to downvote comment. Please try again.');
        },
    });

    // Comment mutation
    const commentMutation = useMutation({
        mutationFn: async ({ postId, comment }) => {
            if (!user) throw new Error('You must be logged in to comment.');
            const response = await axiosSecure.post(`/user/post/${postId}/comment`, {
                comment,
                userName: displayName || 'Anonymous',
                userImage: photoURL || 'https://placehold.co/40x40',
                userEmail: email || '',
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
            setCommentText('');
        },
        onError: (error) => {
            console.error('Error posting comment:', error);
            alert(error.response?.data?.message || error.message || 'Failed to post comment. Please try again.');
        },
    });

    // Reply mutation
    const replyMutation = useMutation({
        mutationFn: async ({ postId, commentId, reply }) => {
            if (!user) throw new Error('You must be logged in to reply.');
            const response = await axiosSecure.post(`/user/post/${postId}/comment/${commentId}/reply`, {
                reply,
                userName: displayName || 'Anonymous',
                userImage: photoURL || 'https://placehold.co/40x40',
                userEmail: email || '',
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPosts']);
            setReplyText('');
            setReplyToCommentId(null);
        },
        onError: (error) => {
            console.error('Error posting reply:', error);
            alert(error.response?.data?.message || error.message || 'Failed to post reply. Please try again.');
        },
    });

    // Handle post upvote
    const handleUpvote = (postId, e) => {
        e.stopPropagation();
        upvoteMutation.mutate(postId);
    };

    // Handle post downvote
    const handleDownvote = (postId, e) => {
        e.stopPropagation();
        downvoteMutation.mutate(postId);
    };

    // Handle comment upvote
    const handleCommentUpvote = (postId, commentId, e) => {
        e.stopPropagation();
        commentUpvoteMutation.mutate({ postId, commentId });
    };

    // Handle comment downvote
    const handleCommentDownvote = (postId, commentId, e) => {
        e.stopPropagation();
        commentDownvoteMutation.mutate({ postId, commentId });
    };

    // Handle comment submission
    const handleCommentSubmit = (e) => {
        e.stopPropagation();
        if (commentText.trim()) {
            commentMutation.mutate({ postId: userPost._id, comment: commentText });
        }
    };

    // Handle reply submission
    const handleReplySubmit = (commentId, e) => {
        e.stopPropagation();
        if (replyText.trim()) {
            replyMutation.mutate({ postId: userPost._id, commentId, reply: replyText });
        }
    };

    // Open/close modal
    const openModal = (e) => {
        e.stopPropagation();
        if (!user) {
            alert('Please log in to comment.');
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = (e) => {
        e.stopPropagation();
        setIsModalOpen(false);
        setCommentText('');
        setReplyText('');
        setReplyToCommentId(null);
    };

    // Navigate to post details
   

    // Ensure author name and image have valid fallbacks
    const authorName = userPost?.authorName || 'Anonymous';
    const authorImage = userPost?.authorImage || 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';

    // Render loading state for auth
    if (authLoading) {
        return (
            <div className="min-h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-xl animate-pulse">
                <p className="text-gray-700 text-xl font-semibold">Loading user data...</p>
            </div>
        );
    }

    // Render loading state for post
    if (isPending) {
        return (
            <div className="min-h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-xl animate-pulse">
                <p className="text-gray-700 text-xl font-semibold">Loading post...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="min-h-64 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center rounded-2xl shadow-xl">
                <p className="text-red-700 text-xl font-semibold">{error.message || 'Failed to load post'}</p>
            </div>
        );
    }

    // Render post
    return (
        <>
            <div
                className="shadow-md rounded-2xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={openModal}
            >
                {/* Author Image */}
                <div className="relative">
                    <img
                        src={authorImage}
                        alt={authorName}
                        className="w-18 h-18 rounded-full object-cover border-4 border-gradient-to-br from-blue-200 to-purple-300 shadow-lg transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';
                            e.target.onerror = null; // Prevent recursive error
                        }}
                    />
                </div>
                {/* Post Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h1 className="font-bold text-gray-500 mb-5">Author: {authorName}</h1>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{userPost.postTitle || 'Untitled Post'}</h2>
                        <p className="text-gray-700 mb-4 line-clamp-2">{userPost.postDescription || 'No description available.'}</p>
                        <p>
                            <strong className="text-gray-800">Posted:</strong>{' '}
                            {new Date(userPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                        {/* Post Photo */}
                        {userPost.postPhoto && (
                            <div className="mt-4">
                                <img
                                    src={userPost.postPhoto}
                                    alt={userPost.postTitle || 'Post Image'}
                                    className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/150x150';
                                        e.target.onerror = null; // Prevent recursive error
                                    }}
                                />
                            </div>
                        )}
                        {/* Metadata (Tag, Posted, Comments) */}
                        <div className="mt-2 flex justify-between gap-4 text-gray-600">
                            <p>
                                <strong className="text-gray-800">Tag:</strong> {userPost.tag || 'Lifestyle'}
                            </p>
                            <p>
                                <strong className="text-gray-400">Comments:</strong> {userPost.comments?.length || 0}
                            </p>
                        </div>
                    </div>
                    {/* Vote, Share, and Comment Section */}
                    <div className="mt-6 flex items-center gap-6">
                        <button
                            onClick={(e) => handleUpvote(userPost._id, e)}
                            className="flex items-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                            title="Upvote"
                            disabled={upvoteMutation.isLoading || !user}
                        >
                            <FaArrowUp /> <span className="font-medium">{userPost.upVote || 0}</span>
                        </button>
                        <button
                            onClick={(e) => handleDownvote(userPost._id, e)}
                            className="flex items-center gap-2 px-5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                            title="Downvote"
                            disabled={downvoteMutation.isLoading || !user}
                        >
                            <FaArrowDown /> <span className="font-medium">{userPost.downVote || 0}</span>
                        </button>


                        


                        <button
                            onClick={openModal}
                            className="rounded-sm px-2.5 text-gray-500 py-1 bg-gray-200 flex items-center transition-colors duration-300 hover:bg-gray-300"
                        >
                            Comment <FaRegComment className="ml-1" />
                        </button>


                        <div className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-300">
                            <FacebookShareButton url={shareUrl} quote={shareTitle}>
                                <FacebookIcon size={20} round />
                            </FacebookShareButton>
                            <FaShare className="ml-1" />
                        </div>



                    </div>
                </div>
            </div>

            {/* Comment Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className="max-w-3xl w-[90%] mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-2xl p-8 outline-none max-h-[80vh] overflow-y-auto"
                overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center"
            >
                <div className="flex flex-col gap-6">
                    {/* Full Post Content in Modal */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
                        {/* Author Image */}
                        <div className="relative">
                            <img
                                src={authorImage}
                                alt={authorName}
                                className="w-24 h-24 rounded-full object-cover border-4 border-gradient-to-br from-blue-200 to-purple-300 shadow-lg"
                                onError={(e) => {
                                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';
                                    e.target.onerror = null; // Prevent recursive error
                                }}
                            />
                        </div>
                        {/* Post Content */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">{userPost.postTitle || 'Untitled Post'}</h2>
                                <p className="text-gray-700 mb-4">{userPost.postDescription || 'No description available.'}</p>
                                {/* Post Photo */}
                                {userPost.postPhoto && (
                                    <div className="mt-4">
                                        <img
                                            src={userPost.postPhoto}
                                            alt={userPost.postTitle || 'Post Image'}
                                            className="w-full h-64 object-cover rounded-lg shadow-md"
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/150x150';
                                                e.target.onerror = null; // Prevent recursive error
                                            }}
                                        />
                                    </div>
                                )}
                                {/* Metadata (Tag, Posted, Comments) */}
                                <div className="mt-2 flex flex-row gap-4 text-gray-600 text-sm">
                                    <p>
                                        <strong className="text-gray-800">Tag:</strong> {userPost.tag || 'Lifestyle'}
                                    </p>
                                    <p>
                                        <strong className="text-gray-800">Posted:</strong>{' '}
                                        {new Date(userPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    <p>
                                        <strong className="text-gray-800">Comments:</strong> {userPost.comments?.length || 0}
                                    </p>
                                </div>
                            </div>
                            {/* Vote and Share Section */}
                            <div className="mt-6 flex items-center gap-6">
                                <button
                                    onClick={(e) => handleUpvote(userPost._id, e)}
                                    className="flex items-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                                    title="Upvote"
                                    disabled={upvoteMutation.isLoading || !user}
                                >
                                    <FaArrowUp /> <span className="font-medium">{userPost.upVote || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => handleDownvote(userPost._id, e)}
                                    className="flex items-center gap-2 px-5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                                    title="Downvote"
                                    disabled={downvoteMutation.isLoading || !user}
                                >
                                    <FaArrowDown /> <span className="font-medium">{userPost.downVote || 0}</span>
                                </button>
                                <div className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-300">
                                    <FacebookShareButton url={shareUrl} quote={shareTitle}>
                                        <FacebookIcon size={20} round />
                                    </FacebookShareButton>
                                    <FaShare className="ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Comments List */}
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">Comments</h3>
                        {/* Sort Buttons */}
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setCommentSort('newest')}
                                className={`font-medium ${commentSort === 'newest' ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
                            >
                                Sort by Newest
                            </button>
                            <button
                                onClick={() => setCommentSort('popularity')}
                                className={`font-medium ${commentSort === 'popularity' ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
                            >
                                Sort by Popularity
                            </button>
                        </div>
                        {sortedComments.length > 0 ? (
                            sortedComments.map((comment, index) => (
                                <div key={index} className="border-t py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={comment.userImage || 'https://placehold.co/40x40'}
                                            alt={comment.userName || 'Anonymous'}
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/40x40';
                                                e.target.onerror = null; // Prevent recursive error
                                            }}
                                        />
                                        <div>
                                            <p className="font-semibold">{comment.userName || 'Anonymous'}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(comment.createdAt || Date.now()).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-gray-700">{comment.text}</p>
                                    {/* Comment Votes */}
                                    <div className="mt-2 flex items-center gap-6">
                                        <button
                                            onClick={(e) => handleCommentUpvote(userPost._id, comment._id, e)}
                                            className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                                            title="Upvote comment"
                                            disabled={commentUpvoteMutation.isLoading || !user}
                                        >
                                            <FaArrowUp /> <span className="font-medium">{comment.upVote || 0}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleCommentDownvote(userPost._id, comment._id, e)}
                                            className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                                            title="Downvote comment"
                                            disabled={commentDownvoteMutation.isLoading || !user}
                                        >
                                            <FaArrowDown /> <span className="font-medium">{comment.downVote || 0}</span>
                                        </button>
                                    </div>
                                    {/* Reply Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!user) {
                                                alert('Please log in to reply.');
                                                return;
                                            }
                                            setReplyToCommentId(comment._id);
                                        }}
                                        className="mt-2 flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors duration-300"
                                    >
                                        <FaReply /> Reply
                                    </button>
                                    {/* Reply Input */}
                                    {replyToCommentId === comment._id && (
                                        <div className="mt-2 flex items-center gap-2 ml-4">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your reply..."
                                                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                rows="2"
                                            />
                                            <button
                                                onClick={(e) => handleReplySubmit(comment._id, e)}
                                                className={`p-2 rounded-lg transition-colors duration-300 ${
                                                    replyText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                                                }`}
                                                disabled={replyMutation.isLoading || !replyText.trim()}
                                            >
                                                <FaPaperPlane />
                                            </button>
                                        </div>
                                    )}
                                    {/* Replies List */}
                                    {comment.replies?.length > 0 && (
                                        <div className="ml-6 mt-2">
                                            {comment.replies.map((reply, replyIndex) => (
                                                <div key={replyIndex} className="border-l pl-4 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={reply.userImage || 'https://placehold.co/40x40'}
                                                            alt={reply.userName || 'Anonymous'}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            onError={(e) => {
                                                                e.target.src = 'https://placehold.co/40x40';
                                                                e.target.onerror = null; // Prevent recursive error
                                                            }}
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-sm">{reply.userName || 'Anonymous'}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(reply.createdAt || Date.now()).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-1 text-gray-700 text-sm">{reply.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">No comments yet.</p>
                        )}
                    </div>
                    {/* Comment Input */}
                    <div className="flex items-center gap-2">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write your comment..."
                            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="4"
                        />
                        <button
                            onClick={handleCommentSubmit}
                            className={`p-3 rounded-lg transition-colors duration-300 ${
                                commentText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                            }`}
                            disabled={commentMutation.isLoading || !commentText.trim()}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 self-end"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default AllUserPost;