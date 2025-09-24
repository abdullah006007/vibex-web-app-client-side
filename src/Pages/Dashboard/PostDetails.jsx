// src/Pages/Dashboard/PostDetails.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../Hooks/useAuth';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { FaArrowUp, FaArrowDown, FaPaperPlane, FaRegComment, FaReply, FaShare } from 'react-icons/fa';
import Modal from 'react-modal';
import { FacebookShareButton, FacebookIcon, WhatsappShareButton, WhatsappIcon } from 'react-share';
import toast from 'react-hot-toast';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const PostDetails = () => {
  const { postId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { displayName, photoURL, email } = user || {};
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);

  // Share URL
  const shareUrl = `${window.location.origin}/dashboard/post/${postId}`;
  const shareTitle = 'Check out this post!';

  // Fetch post
  const { data: post, isPending, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await axiosSecure.get(`/user/post/${postId}`);
      return response.data;
    },
    enabled: !!postId,
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to upvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['posts']);
      toast.success('Upvoted successfully!');
    },
    onError: (error) => {
      console.error('Error upvoting post:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upvote post.');
    },
  });

  // Downvote mutation
  const downvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to downvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['posts']);
      toast.success('Downvoted successfully!');
    },
    onError: (error) => {
      console.error('Error downvoting post:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to downvote post.');
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
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['posts']);
      setCommentText('');
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to post comment.');
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ postId, commentId, reply }) => {
      if (!user) throw new Error('You must be logged in to reply.');
      if (!postId || !commentId) throw new Error('Invalid post or comment ID.');
      console.log('Sending reply:', { postId, commentId, reply }); // Debug
      const response = await axiosSecure.post(`/user/post/${postId}/comment/${commentId}/reply`, {
        reply,
        userName: displayName || 'Anonymous',
        userImage: photoURL || 'https://placehold.co/40x40',
        userEmail: email || '',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['posts']);
      setReplyText('');
      setReplyToCommentId(null);
      toast.success('Reply added successfully!');
    },
    onError: (error) => {
      console.error('Error posting reply:', error);
      const message =
        error.response?.status === 404
          ? 'The post or comment was not found. It may have been deleted.'
          : error.response?.data?.message || error.message || 'Failed to post reply.';
      toast.error(message);
    },
  });

  // Event handlers
  const handleUpvote = (postId, e) => {
    e.stopPropagation();
    upvoteMutation.mutate(postId);
  };

  const handleDownvote = (postId, e) => {
    e.stopPropagation();
    downvoteMutation.mutate(postId);
  };

  const handleCommentSubmit = (e) => {
    e.stopPropagation();
    if (commentText.trim()) {
      commentMutation.mutate({ postId, comment: commentText });
    }
  };

  const handleReplySubmit = (commentId, e) => {
    e.stopPropagation();
    if (replyText.trim()) {
      replyMutation.mutate({ postId, commentId, reply: replyText });
    }
  };

  const openModal = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to comment.');
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

  // Render loading state
  if (authLoading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-red-700 text-xl font-semibold">
          {error.response?.status === 404 ? 'Post not found.' : error.message || 'Failed to load post.'}
        </p>
      </div>
    );
  }

  // Ensure post exists
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-red-700 text-xl font-semibold">Post not found.</p>
      </div>
    );
  }

  // Ensure author name and image have valid fallbacks
  const authorName = post.authorName || 'Anonymous';
  const authorImage = post.authorImage || 'https://placehold.co/100x100';

  // Render post
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="shadow-md rounded-2xl p-6 flex flex-col sm:flex-row gap-6 bg-white mb-8">
        <div className="relative">
          <img
            src={authorImage}
            alt={authorName}
            className="w-24 h-24 rounded-full object-cover border-4 border-gradient-to-br from-blue-200 to-purple-300 shadow-lg"
            onError={(e) => {
              e.target.src = 'https://placehold.co/100x100';
              e.target.onerror = null;
            }}
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="font-bold text-gray-500 mb-5">Author: {authorName}</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{post.postTitle || 'Untitled Post'}</h2>
            <p className="text-gray-700 mb-4">{post.postDescription || 'No description available.'}</p>
            {post.postPhoto && (
              <div className="mt-4">
                <img
                  src={post.postPhoto}
                  alt={post.postTitle || 'Post Image'}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/150x150';
                    e.target.onerror = null;
                  }}
                />
              </div>
            )}
            <div className="mt-2 flex justify-between gap-4 text-gray-600">
              <p>
                <strong className="text-gray-800">Tag:</strong>{' '}
                <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {post.tag || 'Lifestyle'}
                </span>
              </p>
              <p>
                <strong className="text-gray-800">Posted:</strong>{' '}
                {new Date(post.createdAt || '2025-09-21T11:48:00').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Dhaka',
                })}
              </p>
              <p>
                <strong className="text-gray-400">Comments:</strong> {post.comments?.length || 0}
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <button
              onClick={(e) => handleUpvote(postId, e)}
              className="flex items-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
              title="Upvote"
              disabled={upvoteMutation.isLoading || !user}
            >
              <FaArrowUp /> <span className="font-medium">{post.upVote || 0}</span>
              {upvoteMutation.isLoading && <span className="ml-2 text-sm">Processing...</span>}
            </button>
            <button
              onClick={(e) => handleDownvote(postId, e)}
              className="flex items-center gap-2 px-5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
              title="Downvote"
              disabled={downvoteMutation.isLoading || !user}
            >
              <FaArrowDown /> <span className="font-medium">{post.downVote || 0}</span>
              {downvoteMutation.isLoading && <span className="ml-2 text-sm">Processing...</span>}
            </button>
            <div className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-300">
              <FacebookShareButton url={shareUrl} quote={shareTitle}>
                <FacebookIcon size={20} round />
              </FacebookShareButton>
              <WhatsappShareButton url={shareUrl} title={shareTitle}>
                <WhatsappIcon size={20} round />
              </WhatsappShareButton>
              <FaShare className="ml-1" />
            </div>
            <button
              onClick={openModal}
              className="rounded-sm px-2.5 text-gray-500 py-1 bg-gray-200 flex items-center transition-colors duration-300 hover:bg-gray-300"
            >
              Comment <FaRegComment className="ml-1" />
            </button>
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
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
            <div className="relative">
              <img
                src={authorImage}
                alt={authorName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gradient-to-br from-blue-200 to-purple-300 shadow-lg"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/100x100';
                  e.target.onerror = null;
                }}
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{post.postTitle || 'Untitled Post'}</h2>
                <p className="text-gray-700 mb-4">{post.postDescription || 'No description available.'}</p>
                {post.postPhoto && (
                  <div className="mt-4">
                    <img
                      src={post.postPhoto}
                      alt={post.postTitle || 'Post Image'}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/150x150';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                )}
                <div className="mt-2 flex flex-row gap-4 text-gray-600 text-sm">
                  <p>
                    <strong className="text-gray-800">Tag:</strong>{' '}
                    <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {post.tag || 'Lifestyle'}
                    </span>
                  </p>
                  <p>
                    <strong className="text-gray-800">Posted:</strong>{' '}
                    {new Date(post.createdAt || '2025-09-21T11:48:00').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Dhaka',
                    })}
                  </p>
                  <p>
                    <strong className="text-gray-800">Comments:</strong> {post.comments?.length || 0}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-6">
                <button
                  onClick={(e) => handleUpvote(postId, e)}
                  className="flex items-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                  title="Upvote"
                  disabled={upvoteMutation.isLoading || !user}
                >
                  <FaArrowUp /> <span className="font-medium">{post.upVote || 0}</span>
                  {upvoteMutation.isLoading && <span className="ml-2 text-sm">Processing...</span>}
                </button>
                <button
                  onClick={(e) => handleDownvote(postId, e)}
                  className="flex items-center gap-2 px-5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                  title="Downvote"
                  disabled={downvoteMutation.isLoading || !user}
                >
                  <FaArrowDown /> <span className="font-medium">{post.downVote || 0}</span>
                  {downvoteMutation.isLoading && <span className="ml-2 text-sm">Processing...</span>}
                </button>
                <div className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-300">
                  <FacebookShareButton url={shareUrl} quote={shareTitle}>
                    <FacebookIcon size={20} round />
                  </FacebookShareButton>
                  <WhatsappShareButton url={shareUrl} title={shareTitle}>
                    <WhatsappIcon size={20} round />
                  </WhatsappShareButton>
                  <FaShare className="ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Comments</h3>
            {post.comments?.length > 0 ? (
              post.comments.map((comment, index) => (
                <div key={index} className="border-t py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={comment.userImage || 'https://placehold.co/40x40'}
                      alt={comment.userName || 'Anonymous'}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/40x40';
                        e.target.onerror = null;
                      }}
                    />
                    <div>
                      <p className="font-semibold">{comment.userName || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt || '2025-09-21T11:48:00').toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Dhaka',
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{comment.text}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        toast.error('Please log in to reply.');
                        return;
                      }
                      setReplyToCommentId(comment._id);
                    }}
                    className="mt-2 flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors duration-300"
                  >
                    <FaReply /> Reply
                  </button>
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
                          replyText.trim() && !replyMutation.isLoading
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500'
                        }`}
                        disabled={replyMutation.isLoading || !replyText.trim()}
                      >
                        {replyMutation.isLoading ? 'Sending...' : <FaPaperPlane />}
                      </button>
                    </div>
                  )}
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
                                e.target.onerror = null;
                              }}
                            />
                            <div>
                              <p className="font-semibold text-sm">{reply.userName || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(reply.createdAt || '2025-09-21T11:48:00').toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Dhaka',
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
                commentText.trim() && !commentMutation.isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500'
              }`}
              disabled={commentMutation.isLoading || !commentText.trim()}
            >
              {commentMutation.isLoading ? 'Sending...' : <FaPaperPlane />}
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
    </div>
  );
};

export default PostDetails;