// PostComments.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import useAuth from '../../Hooks/useAuth';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { FaComment, FaFlag } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PostComments = () => {
  const { user, loading: authLoading } = useAuth();
  const { email, uid } = user || {};
  const { postId } = useParams();
  const axiosInstance = useAxiosSecure();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reportFeedback, setReportFeedback] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Fetch post with comments
  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {

      const response = await axiosInstance.get(`/user/post/${postId}`);

      return response.data;
    },
    enabled: !!postId && !!user && !authLoading,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ comment }) => {
      const response = await axiosInstance.post(`/user/post/${postId}/comment`, {
        comment,
        userName: user?.displayName || 'Anonymous',
        userImage: user?.photoURL || 'https://placehold.co/40x40',
        userEmail: email,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post', postId]);
      setNewComment('');
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to add comment';
      toast.error(errorMessage);
    },
  });

  // Report comment mutation
  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, feedback }) => {
  
      const response = await axiosInstance.post(`/user/post/${postId}/comment/${commentId}/report`, {
        feedback,
      });
      return response.data;
    },
    onSuccess: () => {
      setReportFeedback('');
      setReportingCommentId(null);
      toast.success('Comment reported successfully!');
    },
    onError: (error) => {
      console.error('PostComments: Error reporting comment:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to report comment';
      toast.error(errorMessage);
    },
  });

  // Handle report submission
  const handleReport = (commentId) => {
    if (!user || authLoading) {
      toast.error('Please log in to report a comment');
      navigate('/login');
      return;
    }
    if (!reportFeedback.trim()) {
      toast.error('Please provide feedback for the report');
      return;
    }
    reportCommentMutation.mutate({ commentId, feedback: reportFeedback });
  };

  // Handle add comment
  const handleAddComment = () => {
    if (!user || authLoading) {
      toast.error('Please log in to add a comment');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    addCommentMutation.mutate({ comment: newComment });
  };

  // Render loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 text-lg font-bold">Loading...</div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to fetch post'}</p>
          <button
            onClick={() => queryClient.invalidateQueries(['post', postId])}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">Post not found.</p>
          <button
            onClick={() => navigate('/dashboard/my-posts')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to My Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">{post.postTitle || 'Untitled Post'}</h1>
        <div className="bg-white shadow-xl rounded-lg p-6 mb-6">
          {post.postPhoto && (
            <img src={post.postPhoto} alt="Post" className="w-full h-64 object-cover rounded-lg mb-4" />
          )}
          <p className="text-gray-600 mb-4">{post.postDescription || 'No description'}</p>
          <p className="text-sm text-gray-500 mb-4">
            Tag: {post.tag || 'None'} | Posted: {new Date(post.createdAt).toLocaleDateString('en-US')}
          </p>
          <p className="text-sm text-gray-500">
            Votes: {(post.upVote || 0) + (post.downVote || 0)} (Up: {post.upVote || 0}, Down: {post.downVote || 0})
          </p>
        </div>

        {/* Comments Section */}
        <div className="bg-white shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comments</h2>
          <div className="mb-6">
            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              rows="4"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={handleAddComment}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={addCommentMutation.isLoading || !newComment.trim() || authLoading}
            >
              Post Comment
            </button>
          </div>

          {post.comments?.length === 0 ? (
            <p className="text-gray-600">No comments yet.</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment._id} className="border-b py-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={comment.userImage || 'https://placehold.co/40x40'}
                    alt="Commenter"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{comment.userName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{comment.text}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setReportingCommentId(comment._id);
                      setReportFeedback('');
                    }}
                    className="text-red-600 hover:text-red-800 flex items-center"
                    title="Report Comment"
                    disabled={!user || authLoading}
                  >
                    <FaFlag className="mr-1" /> Report
                  </button>
                </div>
                {reportingCommentId === comment._id && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <textarea
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      rows="3"
                      placeholder="Why are you reporting this comment?"
                      value={reportFeedback}
                      onChange={(e) => setReportFeedback(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReport(comment._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        disabled={reportCommentMutation.isLoading || !reportFeedback.trim()}
                      >
                        Submit Report
                      </button>
                      <button
                        onClick={() => setReportingCommentId(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComments;