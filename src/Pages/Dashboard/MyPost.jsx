import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import useAuth from '../../Hooks/useAuth';
import { FaComment, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../Hooks/useAxiosSecure';

const MyPost = () => {
  const { user } = useAuth();
  const { uid } = user || {};
  const axiosInstance = useAxiosSecure();
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  const { data: postCount = { count: 0 }, isLoading: isLoadingCount, error: countError } = useQuery({
    queryKey: ['postCount', uid],
    queryFn: async () => {
      if (!uid) throw new Error('User not authenticated');
      const response = await axiosInstance.get(`/user/post/count/${uid}`);

      return response.data;
    },
    enabled: !!uid,
  });


  const { data: posts = [], isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['posts', uid],
    queryFn: async () => {
      if (!uid) throw new Error('User not authenticated');
      const response = await axiosInstance.get(`/user/posts/${uid}`);
 
      return response.data;
    },
    enabled: !!uid,
  });


  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
  
      const response = await axiosInstance.delete(`/user/post/${postId}?userId=${uid}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts', uid]);
      queryClient.invalidateQueries(['postCount', uid]);
      toast.success('Post deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to delete post. Please try again.';
      toast.error(errorMessage);
    },
  });

  const handleDelete = (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    deletePostMutation.mutate(postId);
  };


  const handleComment = (postId) => {
 
    navigate(`/dashboard/post/${postId}/comments`);
  };


  const handleViewPost = (postId) => {
 
    navigate(`/dashboard/post/${postId}`);
  };

  if (isLoadingCount || isLoadingPosts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 text-lg font-bold">Loading posts...</div>
      </div>
    );
  }


  if (countError || postsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">
            {countError?.message || postsError?.message || 'Failed to fetch posts'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">My Posts</h1>
        <p className="text-lg text-gray-600 mb-6 text-center">
          You have created {postCount?.count ?? 0} {postCount?.count === 1 ? 'post' : 'posts'}.
        </p>
        {posts.length === 0 ? (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">You haven't created any posts yet.</p>
            <button
              onClick={() => navigate('/dashboard/add-post')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create a Post
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number of Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.postTitle || 'Untitled Post'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tag: {post.tag || 'None'} | Posted:{' '}
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(post.upVote || 0) + (post.downVote || 0)}</div>
                      <div className="text-sm text-gray-500">
                        (Up: {post.upVote || 0}, Down: {post.downVote || 0})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button
                        onClick={() => handleViewPost(post._id)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        title="View Post"
                      >
                        <FaEye className="mr-1" /> View
                      </button>
                      <button
                        onClick={() => handleComment(post._id)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        title="View Comments"
                      >
                        <FaComment className="mr-1" /> Comment
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                        title="Delete Post"
                        disabled={deletePostMutation.isLoading}
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPost;