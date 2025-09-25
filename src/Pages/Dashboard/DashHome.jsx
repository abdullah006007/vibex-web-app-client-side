import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import useAuth from '../../Hooks/useAuth';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaCrown, FaCheckCircle } from 'react-icons/fa';

const DashHome = () => {
  const { user, loading: authLoading } = useAuth();
  const { displayName, email, photoURL, uid } = user || {};
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  // Fetch user membership status
  const { data: userData = { subscription: 'free', Badge: 'Bronze' }, isLoading: userLoading } = useQuery({
    queryKey: ['userSubscription', email],
    queryFn: async () => {
      if (!email) return { subscription: 'free', Badge: 'Bronze' };
      const response = await axiosSecure.get(`/users/role/${email}`);
      console.log('User subscription data:', response.data);
      return response.data;
    },
    enabled: !!email && !authLoading,
  });

  // Fetch post count
  const { data: postCount = { count: 0 }, isLoading: postCountLoading } = useQuery({
    queryKey: ['postCount', uid],
    queryFn: async () => {
      if (!uid) return { count: 0 };
      const response = await axiosSecure.get(`/user/post/count/${uid}`);
      console.log('Post count:', response.data);
      return response.data;
    },
    enabled: !!uid && !authLoading,
  });

  // Fetch recent posts
  const { data: postsData = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', uid],
    queryFn: async () => {
      if (!uid) return [];
      const response = await axiosSecure.get(`/user/posts/${uid}`);
      console.log('Recent posts:', response.data);
      return response.data.slice(0, 3);
    },
    enabled: !!uid && !authLoading,
  });

  // Invalidate queries after navigation from membership page
  useEffect(() => {
    if (window.location.state?.fromMembership) {
      queryClient.invalidateQueries(['userSubscription', email]);
      console.log('Invalidated userSubscription query after membership upgrade');
    }
  }, [email, queryClient]);

  useEffect(() => {
    if (postsData) {
      setPosts(postsData);
    }
  }, [postsData]);

  // Handle Upgrade button click
  const handleUpgrade = () => {
    navigate('/membership');
  };

  // Render loading state
  if (authLoading || userLoading || postCountLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 text-2xl font-bold flex items-center">
          <svg className="animate-spin h-6 w-6 mr-3 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading Dashboard...
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Please log in to view your dashboard.'}</p>
          <button
            onClick={() => navigate('/join-us')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 transform hover:scale-105 transition-transform duration-500">
        {/* Profile Section */}
        <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
          <div className="relative">
            <img
              src={photoURL || 'https://placehold.co/150'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-100 shadow-lg transition-transform duration-300 hover:scale-110"
            />
            {userData?.subscription === 'premium' && (
              <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-md">
                <FaCrown className="mr-1" /> Premium
              </span>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-800">{displayName || 'User'}</h1>
            <p className="text-gray-600 mt-2">{email || 'No email provided'}</p>
            <p className="text-gray-600 mt-1 bg-indigo-100 rounded px-2 inline-block">
              Subscription: {userData?.subscription === 'premium' ? 'Premium' : 'Free'}
            </p>
            <p className="text-gray-600 mt-1">
              Total Posts: {postCount?.count ?? 0}
              {userData?.subscription !== 'premium' && (
                <span className="text-gray-500 ml-2">(Free users: max 5 posts)</span>
              )}
            </p>
            {/* Badges Section */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://img.icons8.com/color/48/000000/medal.png"
                  alt="Bronze Badge"
                  className="w-8 h-8"
                />
                <span className="text-sm font-semibold text-gray-700">Bronze Badge</span>
              </div>
              {userData?.subscription === 'premium' ? (
                <div className="flex items-center gap-2">
                  <img
                    src="https://img.icons8.com/color/48/000000/gold-medal.png"
                    alt="Gold Badge"
                    className="w-8 h-8"
                  />
                  <span className="text-sm font-semibold text-gray-700">Gold Badge</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 flex items-center"
                >
                  <FaCrown className="mr-2" /> Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaCheckCircle className="mr-2 text-indigo-600" /> My Recent Posts
          </h2>
          {posts.length === 0 ? (
            <div className="p-6 bg-indigo-50 rounded-lg shadow-inner text-center">
              <p className="text-gray-600 text-lg">You haven't created any posts yet.</p>
              <button
                onClick={() => navigate('/dashboard/add-post')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {post.postPhoto && (
                      <img
                        src={post.postPhoto}
                        alt="Post"
                        className="w-full md:w-32 h-32 object-cover rounded-lg shadow-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800">{post.postTitle}</h3>
                      <p className="text-gray-600 mt-2 line-clamp-2">{post.postDescription}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          <strong>Tag:</strong> {post.tag || 'None'}
                        </span>
                        <span>
                          <strong>Upvotes:</strong> {post.upVote || 0}
                        </span>
                        <span>
                          <strong>Downvotes:</strong> {post.downVote || 0}
                        </span>
                        <span>
                          <strong>Posted:</strong>{' '}
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashHome;