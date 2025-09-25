import React, { useState, useMemo } from 'react';
import useAuth from '../../Hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { FaArrowUp, FaArrowDown, FaPaperPlane, FaRegComment, FaReply, FaShare } from 'react-icons/fa';
import Modal from 'react-modal';
import { FacebookShareButton, FacebookIcon } from 'react-share';


Modal.setAppElement('#root');

const AllUserPost = ({ userPost, isPending, error }) => {
  const { user, loading: authLoading } = useAuth();
  const { displayName, photoURL, email } = user || {};
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [commentSort, setCommentSort] = useState('newest');

 

  const shareUrl = window.location.href;
  const shareTitle = userPost?.postTitle || 'Check out this post!';


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


  const upvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to upvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUserPosts']);
    },
    onError: (error) => {
      console.error('Error upvoting post:', error);
      alert(error.response?.data?.message || error.message || 'Failed to upvote post. Please try again.');
    },
  });


  const downvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to downvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUserPosts']);
    },
    onError: (error) => {
      console.error('Error downvoting post:', error);
      alert(error.response?.data?.message || error.message || 'Failed to downvote post. Please try again.');
    },
  });


  const commentUpvoteMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!user) throw new Error('You must be logged in to upvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUserPosts']);
    },
    onError: (error) => {
      console.error('Error upvoting comment:', error);
      alert(error.response?.data?.message || error.message || 'Failed to upvote comment. Please try again.');
    },
  });


  const commentDownvoteMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!user) throw new Error('You must be logged in to downvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUserPosts']);
    },
    onError: (error) => {
      console.error('Error downvoting comment:', error);
      alert(error.response?.data?.message || error.message || 'Failed to downvote comment. Please try again.');
    },
  });


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
      queryClient.invalidateQueries(['allUserPosts']);
      setCommentText('');
    },
    onError: (error) => {
      console.error('Error posting comment:', error);
      alert(error.response?.data?.message || error.message || 'Failed to post comment. Please try again.');
    },
  });


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
      queryClient.invalidateQueries(['allUserPosts']);
      setReplyText('');
      setReplyToCommentId(null);
    },
    onError: (error) => {
      console.error('Error posting reply:', error);
      alert(error.response?.data?.message || error.message || 'Failed to post reply. Please try again.');
    },
  });


  const handleUpvote = (postId, e) => {
    e.stopPropagation();
    upvoteMutation.mutate(postId);
  };


  const handleDownvote = (postId, e) => {
    e.stopPropagation();
    downvoteMutation.mutate(postId);
  };


  const handleCommentUpvote = (postId, commentId, e) => {
    e.stopPropagation();
    commentUpvoteMutation.mutate({ postId, commentId });
  };


  const handleCommentDownvote = (postId, commentId, e) => {
    e.stopPropagation();
    commentDownvoteMutation.mutate({ postId, commentId });
  };

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


  const authorName = userPost?.authorName || 'Anonymous';
  const authorImage = userPost?.authorImage || 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';

 
  if (authLoading) {
    return (
      <div className="min-h-[16rem] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-md p-4 sm:p-6 animate-pulse">
        <p className="text-gray-700 text-base sm:text-lg font-semibold">Loading user data...</p>
      </div>
    );
  }


  if (isPending) {
    return (
      <div className="min-h-[16rem] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-md p-4 sm:p-6 animate-pulse">
        <p className="text-gray-700 text-base sm:text-lg font-semibold">Loading post...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-[16rem] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center rounded-2xl shadow-md p-4 sm:p-6">
        <p className="text-red-700 text-base sm:text-lg font-semibold">{error.message || 'Failed to load post'}</p>
      </div>
    );
  }


  if (!userPost) {
    return (
      <div className="min-h-[16rem] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-md p-4 sm:p-6">
        <p className="text-gray-700 text-base sm:text-lg font-semibold">No post data available.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="shadow-md rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white"
        onClick={openModal}
      >
        {/* Author Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={authorImage}
            alt={authorName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-gradient-to-br from-blue-200 to-purple-300 shadow-md transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';
              e.target.onerror = null;
            }}
          />
          <h1 className="text-sm sm:text-base font-semibold text-gray-600">Author: {authorName}</h1>
        </div>
        {/* Post Content */}
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{userPost.postTitle || 'Untitled Post'}</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-3">{userPost.postDescription || 'No description available.'}</p>
          {/* Post Photo */}
          {userPost.postPhoto && (
            <div className="mt-3 sm:mt-4">
              <img
                src={userPost.postPhoto}
                alt={userPost.postTitle || 'Post Image'}
                className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/150x150';
                  e.target.onerror = null;
                }}
              />
            </div>
          )}
          {/* Metadata */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm">
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
              <strong className="text-gray-800">Tag:</strong> {userPost.tag || 'Lifestyle'}
            </p>
            <p>
              <strong className="text-gray-800">Comments:</strong> {userPost.comments?.length || 0}
            </p>
          </div>
        </div>
        {/* Vote, Share, and Comment Section */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={(e) => handleUpvote(userPost._id, e)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300 disabled:opacity-50 text-sm sm:text-base min-w-[4rem]"
            title="Upvote"
            disabled={upvoteMutation.isLoading || !user}
          >
            <FaArrowUp className="text-base sm:text-lg" /> <span className="font-medium">{userPost.upVote || 0}</span>
          </button>
          <button
            onClick={(e) => handleDownvote(userPost._id, e)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 disabled:opacity-50 text-sm sm:text-base min-w-[4rem]"
            title="Downvote"
            disabled={downvoteMutation.isLoading || !user}
          >
            <FaArrowDown className="text-base sm:text-lg" /> <span className="font-medium">{userPost.downVote || 0}</span>
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors duration-300 text-sm sm:text-base"
          >
            <FaRegComment className="text-base sm:text-lg" /> Comment
          </button>
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300">
            <FacebookShareButton url={shareUrl} quote={shareTitle}>
              <FacebookIcon size={24} round />
            </FacebookShareButton>
            <FaShare className="text-base sm:text-lg" />
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="w-[95%] sm:w-[90%] max-w-3xl mx-auto mt-4 sm:mt-8 mb-4 sm:mb-8 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 outline-none max-h-[90vh] sm:max-h-[80vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-start sm:items-center justify-center"
      >
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Full Post Content in Modal */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            {/* Author Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={authorImage}
                alt={authorName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gradient-to-br from-blue-200 to-purple-300 shadow-md"
                onError={(e) => {
                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';
                  e.target.onerror = null;
                }}
              />
              <h1 className="text-sm sm:text-base font-semibold text-gray-600">Author: {authorName}</h1>
            </div>
            {/* Post Content */}
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{userPost.postTitle || 'Untitled Post'}</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">{userPost.postDescription || 'No description available.'}</p>
              {/* Post Photo */}
              {userPost.postPhoto && (
                <div className="mt-3 sm:mt-4">
                  <img
                    src={userPost.postPhoto}
                    alt={userPost.postTitle || 'Post Image'}
                    className="w-full h-40 sm:h-48 md:h-64 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/150x150';
                      e.target.onerror = null;
                    }}
                  />
                </div>
              )}
              {/* Metadata */}
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm">
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
                  <strong className="text-gray-800">Tag:</strong> {userPost.tag || 'Lifestyle'}
                </p>
                <p>
                  <strong className="text-gray-800">Comments:</strong> {userPost.comments?.length || 0}
                </p>
              </div>
            </div>
            {/* Vote and Share Section */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={(e) => handleUpvote(userPost._id, e)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300 disabled:opacity-50 text-sm sm:text-base min-w-[4rem]"
                title="Upvote"
                disabled={upvoteMutation.isLoading || !user}
              >
                <FaArrowUp className="text-base sm:text-lg" /> <span className="font-medium">{userPost.upVote || 0}</span>
              </button>
              <button
                onClick={(e) => handleDownvote(userPost._id, e)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 disabled:opacity-50 text-sm sm:text-base min-w-[4rem]"
                title="Downvote"
                disabled={downvoteMutation.isLoading || !user}
              >
                <FaArrowDown className="text-base sm:text-lg" /> <span className="font-medium">{userPost.downVote || 0}</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300">
                <FacebookShareButton url={shareUrl} quote={shareTitle}>
                  <FacebookIcon size={24} round />
                </FacebookShareButton>
                <FaShare className="text-base sm:text-lg" />
              </div>
            </div>
          </div>
          {/* Comments List */}
          <div className="mt-4 sm:mt-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Comments</h3>
            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4">
              <button
                onClick={() => setCommentSort('newest')}
                className={`font-medium text-sm sm:text-base px-3 py-1 rounded-lg ${
                  commentSort === 'newest' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 bg-gray-100'
                } hover:text-blue-600 hover:bg-blue-100 transition-colors duration-300`}
              >
                Newest
              </button>
              <button
                onClick={() => setCommentSort('popularity')}
                className={`font-medium text-sm sm:text-base px-3 py-1 rounded-lg ${
                  commentSort === 'popularity' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 bg-gray-100'
                } hover:text-blue-600 hover:bg-blue-100 transition-colors duration-300`}
              >
                Popularity
              </button>
            </div>
            {sortedComments.length > 0 ? (
              sortedComments.map((comment, index) => (
                <div key={index} className="border-t py-3 sm:py-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <img
                      src={comment.userImage || 'https://placehold.co/40x40'}
                      alt={comment.userName || 'Anonymous'}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/40x40';
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm sm:text-base">{comment.userName || 'Anonymous'}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(comment.createdAt || Date.now()).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <p className="mt-1 text-sm sm:text-base text-gray-700">{comment.text}</p>
                      {/* Comment Votes */}
                      <div className="mt-2 flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={(e) => handleCommentUpvote(userPost._id, comment._id, e)}
                          className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300 disabled:opacity-50 text-xs sm:text-sm"
                          title="Upvote comment"
                          disabled={commentUpvoteMutation.isLoading || !user}
                        >
                          <FaArrowUp className="text-xs sm:text-base" /> <span>{comment.upVote || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleCommentDownvote(userPost._id, comment._id, e)}
                          className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 disabled:opacity-50 text-xs sm:text-sm"
                          title="Downvote comment"
                          disabled={commentDownvoteMutation.isLoading || !user}
                        >
                          <FaArrowDown className="text-xs sm:text-base" /> <span>{comment.downVote || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              alert('Please log in to reply.');
                              return;
                            }
                            setReplyToCommentId(comment._id);
                          }}
                          className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors duration-300 text-xs sm:text-sm"
                        >
                          <FaReply /> Reply
                        </button>
                      </div>
                      {/* Reply Input */}
                      {replyToCommentId === comment._id && (
                        <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 ml-4 sm:ml-6">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="flex-1 p-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="2"
                          />
                          <button
                            onClick={(e) => handleReplySubmit(comment._id, e)}
                            className={`p-2 sm:p-3 rounded-lg transition-colors duration-300 ${
                              replyText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                            }`}
                            disabled={replyMutation.isLoading || !replyText.trim()}
                          >
                            <FaPaperPlane className="text-sm sm:text-base" />
                          </button>
                        </div>
                      )}
                      {/* Replies List */}
                      {comment.replies?.length > 0 && (
                        <div className="ml-4 sm:ml-6 mt-2 sm:mt-3">
                          {comment.replies.map((reply, replyIndex) => (
                            <div key={replyIndex} className="border-l pl-3 sm:pl-4 py-2">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <img
                                  src={reply.userImage || 'https://placehold.co/40x40'}
                                  alt={reply.userName || 'Anonymous'}
                                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://placehold.co/40x40';
                                    e.target.onerror = null;
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-xs sm:text-sm">{reply.userName || 'Anonymous'}</p>
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
                                  <p className="mt-1 text-xs sm:text-sm text-gray-700">{reply.text}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm sm:text-base">No comments yet.</p>
            )}
          </div>
          {/* Comment Input */}
          <div className="flex items-start gap-2 sm:gap-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              className="flex-1 p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
            <button
              onClick={handleCommentSubmit}
              className={`p-2 sm:p-3 rounded-lg transition-colors duration-300 ${
                commentText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
              }`}
              disabled={commentMutation.isLoading || !commentText.trim()}
            >
              <FaPaperPlane className="text-sm sm:text-base" />
            </button>
          </div>
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="mt-3 sm:mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 self-end text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
};

export default AllUserPost;