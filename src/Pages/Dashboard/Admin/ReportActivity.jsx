import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTrash, FaUserTimes, FaEye } from 'react-icons/fa';
import useAxiosSecure from '../../../Hooks/useAxiosSecure';
import useAuth from '../../../Hooks/useAuth';

const ReportActivity = () => {
  const { user } = useAuth();
  const { email } = user || {};
  const axiosInstance = useAxiosSecure();
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);

  // Fetch user role
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: ['role', email],
    queryFn: async () => {
      if (!email) throw new Error('Email is required');
      const response = await axiosInstance.get(`/users/role/${email}`);
      return response.data;
    },
    enabled: !!email,
  });

  const role = roleData?.role;

  // Fetch reports
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await axiosInstance.get('/reports');
      return response.data;
    },
    enabled: role === 'admin',
  });

  // Fetch all posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['allPosts'],
    queryFn: async () => {
      const response = await axiosInstance.get('/user/all-post');
      return response.data;
    },
    enabled: role === 'admin',
  });

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await axiosInstance.get('/users');
      return response.data;
    },
    enabled: role === 'admin',
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await axiosInstance.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      queryClient.invalidateQueries(['reports']);
      queryClient.invalidateQueries(['allPosts']);
      alert('User banned successfully!');
      setShowBanModal(false);
      setSelectedReport(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to ban user';
      alert(errorMessage);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      const response = await axiosInstance.delete(`/user/post/${postId}/comment/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      queryClient.invalidateQueries(['allPosts']);
      alert('Comment deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete comment';
      alert(errorMessage);
    },
  });

  // Handle delete user
  const handleDeleteUser = (userId) => {
    if (!window.confirm('Are you sure you want to ban this user? This action cannot be undone.')) return;
    deleteUserMutation.mutate(userId);
  };

  // Handle delete comment
  const handleDeleteComment = (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    deleteCommentMutation.mutate({ postId, commentId });
  };

  // Handle ban confirm
  const handleBanConfirm = () => {
    if (selectedReport.commentedUserId) {
      deleteUserMutation.mutate(selectedReport.commentedUserId);
    }
  };

  // Render loading state
  if (isLoadingRole || (role === 'admin' && (isLoadingReports || isLoadingPosts || isLoadingUsers))) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // Render unauthorized
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Enrich reports with additional data
  const enrichedReports = reports.map((report) => {
    const post = posts.find((p) => p._id === report.postId);
    const comment = post ? post.comments.find((c) => c._id.toString() === report.commentId.toString()) : null;
    const commentedUser = comment ? users.find((u) => u.email === comment.userEmail) : null;

    return {
      ...report,
      postTitle: post ? post.postTitle : 'Post not found',
      commentText: comment ? comment.text : 'Comment not found',
      commentedByName: comment ? comment.userName : 'Unknown',
      commentedByEmail: comment ? comment.userEmail : 'Unknown',
      commentedUserId: commentedUser ? commentedUser._id : null,
    };
  });

  const selectedPost = selectedReport ? posts.find((p) => p._id === selectedReport.postId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Reported Activities</h1>
        {enrichedReports.length === 0 ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">No reported activities found.</p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment Text
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commented By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrichedReports.map((report) => (
                  <tr key={`${report.postId}-${report.commentId}`}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {report.postTitle}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {report.commentText}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {report.commentedByName} ({report.commentedByEmail})
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {report.reporterEmail}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {report.feedback}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(report.reportedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                        title="View Post"
                      >
                        <FaEye className="mr-1" /> View
                      </button>
                      <button
                        onClick={() => handleDeleteComment(report.postId, report.commentId)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                        title="Delete Comment"
                        disabled={deleteCommentMutation.isLoading}
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                      {report.commentedUserId ? (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowBanModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 flex items-center"
                          title="Ban User"
                          disabled={deleteUserMutation.isLoading}
                        >
                          <FaUserTimes className="mr-1" /> Ban
                        </button>
                      ) : (
                        <p className="text-gray-500">User not found</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post View Modal */}
      {selectedReport && selectedPost && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-11/12 max-w-5xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedPost.postTitle}</h2>
            {selectedPost.postPhoto && (
              <img
                src={selectedPost.postPhoto}
                alt="Post"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-600 mb-4">{selectedPost.postDescription}</p>
            <p className="text-sm text-gray-500 mb-4">Tag: {selectedPost.tag}</p>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Comments</h3>
              {selectedPost.comments.length === 0 ? (
                <p className="text-gray-600">No comments available.</p>
              ) : (
                selectedPost.comments.map((comment) => (
                  <div
                    key={comment._id.toString()}
                    className={`p-4 border rounded mb-2 ${
                      comment._id.toString() === selectedReport.commentId.toString() ? 'bg-yellow-100' : ''
                    }`}
                  >
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
                    <p>{comment.text}</p>
                    {comment.replies?.length > 0 && (
                      <div className="ml-6 mt-2">
                        {comment.replies.map((reply) => (
                          <div key={reply._id.toString()} className="p-2 border-l-2 border-gray-300">
                            <div className="flex items-center gap-3 mb-1">
                              <img
                                src={reply.userImage || 'https://placehold.co/40x40'}
                                alt="Replier"
                                className="w-6 h-6 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{reply.userName}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedReport(selectedReport);
                  setShowBanModal(true);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                disabled={!selectedReport.commentedUserId}
              >
                Action
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirm Modal */}
      {showBanModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Warn and Ban User</h2>
            <p className="mb-4">Are you sure you want to warn and ban this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleBanConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                disabled={deleteUserMutation.isLoading}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowBanModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportActivity;