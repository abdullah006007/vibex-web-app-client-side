import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';

import { FaFlag } from 'react-icons/fa';
import useAxios from '../../Hooks/useAxios';


const PostComments = () => {
  const { postId } = useParams();
  const axiosInstance = useAxios()
  const [reportStates, setReportStates] = useState({});
  const [selectedComment, setSelectedComment] = useState(null);
  const feedbackOptions = ['Spam', 'Harassment', 'Misinformation'];

  console.log('PostComments: Fetching post with postId:', postId);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(`/user/post/${postId}`);
        console.log('PostComments: Fetched post data:', response.data);
        return response.data;
      } catch (err) {
        console.error('PostComments: Error fetching post:', err);
        throw err;
      }
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ commentId, feedback }) => {
      const response = await axiosInstance.post(`/user/post/${postId}/comment/${commentId}/report`, { feedback });
      return response.data;
    },
    onSuccess: (_, { commentId }) => {
      setReportStates((prev) => ({
        ...prev,
        [commentId]: { ...prev[commentId], reported: true },
      }));
      alert('Comment reported successfully!');
    },
    onError: (error) => {
      console.error('PostComments: Error reporting comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to report comment.';
      alert(errorMessage);
    },
  });

  const handleFeedbackChange = (commentId, value) => {
    setReportStates((prev) => ({
      ...prev,
      [commentId]: { ...prev[commentId], feedback: value, reported: false },
    }));
  };

  const handleReport = (commentId) => {
    const state = reportStates[commentId];
    if (!state || !state.feedback) return;
    reportMutation.mutate({ commentId, feedback: state.feedback });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    console.error('PostComments: Render error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">
            {error.response?.status === 404
              ? 'Post not found. Please check if the post ID is correct or try again later.'
              : error.message || 'Failed to fetch comments'}
          </p>
        </div>
      </div>
    );
  }

  const comments = post?.comments || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Comments for "{post?.postTitle || 'Post'}"
        </h1>
        {comments.length === 0 ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">No comments yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comments.map((comment) => {
                  const state = reportStates[comment._id] || { feedback: '', reported: false };
                  const isDisabled = !state.feedback || state.reported || reportMutation.isLoading;

                  return (
                    <tr key={comment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comment.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {truncateText(comment.text, 20)}
                        {comment.text.length > 20 && (
                          <span
                            className="text-blue-600 hover:underline cursor-pointer ml-1"
                            onClick={() => setSelectedComment(comment)}
                          >
                            Read More
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={state.feedback}
                          onChange={(e) => handleFeedbackChange(comment._id, e.target.value)}
                          className="border rounded p-1"
                          disabled={state.reported}
                        >
                          <option value="">Select Feedback</option>
                          {feedbackOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleReport(comment._id)}
                          disabled={isDisabled}
                          className={`flex items-center ${
                            isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'
                          }`}
                          title="Report Comment"
                        >
                          <FaFlag className="mr-1" /> Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Full Comment</h2>
            <p className="text-gray-700 mb-4">{selectedComment.text}</p>
            <button
              onClick={() => setSelectedComment(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComments;