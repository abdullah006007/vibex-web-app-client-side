import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTrash, FaUserTimes, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../../Hooks/useAxiosSecure';
import useAuth from '../../../Hooks/useAuth';

const ReportActivity = () => {
  const { user } = useAuth();
  const { email } = user || {};
  const axiosInstance = useAxiosSecure();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10; // Show 10 reports per page

  // Fetch user role
  const { data: roleData, isLoading: isLoadingRole, isError: isRoleError, error: roleError } = useQuery({
    queryKey: ['role', email],
    queryFn: async () => {
      if (!email) throw new Error('Email is required');
      const response = await axiosInstance.get(`/users/role/${email}`);
      return response.data;
    },
    enabled: !!email,
  });

  const role = roleData?.role;

  // Fetch reports with pagination
  const { data, isLoading: isLoadingReports, isError: isReportsError, error: reportsError } = useQuery({
    queryKey: ['reports', currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      const response = await axiosInstance.get(`/reports?${params.toString()}`);
      return response.data;
    },
    enabled: role === 'admin',
    keepPreviousData: true,
  });

  // Destructure paginated data
  const reports = data?.reports || [];
  const totalPages = data?.totalPages || 1;

  // Fetch all posts
  const { data: postsData = { posts: [] }, isLoading: isLoadingPosts, isError: isPostsError, error: postsError } = useQuery({
    queryKey: ['allPosts'],
    queryFn: async () => {
      const response = await axiosInstance.get('/user/all-post');
      console.log('Posts response:', response.data); // Debug log
      if (!response.data.posts) {
        throw new Error('No posts data received');
      }
      return response.data;
    },
    enabled: role === 'admin',
  });

  const posts = Array.isArray(postsData.posts) ? postsData.posts : [];

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers, isError: isUsersError, error: usersError } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await axiosInstance.get('/users');
      return response.data.users || [];
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
      queryClient.invalidateQueries(['reports', currentPage]);
      queryClient.invalidateQueries(['allPosts']);
      toast.success('User banned successfully!');
      setShowBanModal(false);
      setSelectedReport(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to ban user';
      toast.error(errorMessage);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      const response = await axiosInstance.delete(`/user/post/${postId}/comment/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports', currentPage]);
      queryClient.invalidateQueries(['allPosts']);
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete comment';
      toast.error(errorMessage);
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

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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

  // Render unauthorized or role error
  if (isRoleError || role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
          <p className="text-gray-600">
            {isRoleError ? roleError.message || 'Failed to load user role' : 'You do not have permission to access this page.'}
          </p>
        </div>
      </div>
    );
  }

  // Enrich reports with additional data
  const enrichedReports = reports.map((report) => {
    const post = Array.isArray(posts) ? posts.find((p) => p._id === report.postId) : null;
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

  const selectedPost = selectedReport && Array.isArray(posts) ? posts.find((p) => p._id === selectedReport.postId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Reported Activities</h1>
        {isReportsError ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-red-600 text-lg">{reportsError.response?.data?.details || reportsError.message || 'Failed to load reports'}</p>
            <button
              onClick={() => queryClient.invalidateQueries(['reports', currentPage])}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : isPostsError ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-red-600 text-lg">{postsError.response?.data?.details || postsError.message || 'Failed to load posts'}</p>
            <button
              onClick={() => queryClient.invalidateQueries(['allPosts'])}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : isUsersError ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-red-600 text-lg">{usersError.response?.data?.details || usersError.message || 'Failed to load users'}</p>
            <button
              onClick={() => queryClient.invalidateQueries(['allUsers'])}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : enrichedReports.length === 0 ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">No reported activities found.</p>
          </div>
        ) : (
          <>
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
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 rounded-md"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage > totalPages - 3 ? totalPages - 4 + i : currentPage - 2 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 rounded-md"
                >
                  Next
                </button>
                {totalPages > 5 && (
                  <>
                    {currentPage > 3 && <span className="px-1 text-xs text-gray-500">...</span>}
                    {currentPage <= totalPages - 3 && <span className="px-1 text-xs text-gray-500">...</span>}
                  </>
                )}
              </div>
            )}
          </>
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

// Error Boundary Component
class ReportActivityErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something Went Wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap ReportActivity with ErrorBoundary
const WrappedReportActivity = () => (
  <ReportActivityErrorBoundary>
    <ReportActivity />
  </ReportActivityErrorBoundary>
);

export default WrappedReportActivity;