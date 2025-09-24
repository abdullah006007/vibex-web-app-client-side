import React, { useState, useEffect } from 'react';
import useAuth from '../../Hooks/useAuth';
import useAxios from '../../Hooks/useAxios';
import { useNavigate } from 'react-router';

const DashHome = () => {
  const { user } = useAuth();
  const { displayName, email, photoURL, uid, isMember } = user || {};
  const axiosInstance = useAxios();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts and post count
  useEffect(() => {
    const fetchData = async () => {
      if (!uid) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch post count
        const countResponse = await axiosInstance.get(`/user/post/count/${uid}`);
        setPostCount(countResponse.data.count);

        // Fetch recent posts (limit to 3 for dashboard)
        const postsResponse = await axiosInstance.get(`/user/posts/${uid}`);
        setPosts(postsResponse.data.slice(0, 3)); // Show only 3 recent posts
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, axiosInstance]);

  // Handle Upgrade button click
  const handleUpgrade = () => {
    navigate('/membership');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6">
        {/* Profile Section */}
        <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
          <img
            src={photoURL || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800">{displayName || 'User'}</h1>
            <p className="text-gray-600 mt-2">{email || 'No email provided'}</p>
            <p className="text-gray-600 mt-1">
              Total Posts: {postCount !== null ? postCount : 0}
            </p>
            {/* Badges Section */}
            <div className="mt-4 flex gap-4">
              {/* Bronze Badge: Shown if user is registered */}
              <div className="flex items-center gap-2">
                <img
                  src="https://img.icons8.com/color/48/000000/medal.png"
                  alt="Bronze Badge"
                  className="w-8 h-8"
                />
                <span className="text-sm font-semibold text-gray-700">Bronze Badge</span>
                {!isMember && (
                  <button
                    onClick={handleUpgrade}
                    className="px-3 py-1.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              {/* Gold Badge: Shown if user is a member */}
              {isMember && (
                <div className="flex items-center gap-2">
                  <img
                    src="https://img.icons8.com/color/48/000000/gold-medal.png"
                    alt="Gold Badge"
                    className="w-8 h-8"
                  />
                  <span className="text-sm font-semibold text-gray-700">Gold Badge</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Recent Posts</h2>
          {posts.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">You haven't created any posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="p-4 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
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
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          <strong>Tag:</strong> {post.tag}
                        </span>
                        <span>
                          <strong>Upvotes:</strong> {post.upVote}
                        </span>
                        <span>
                          <strong>Downvotes:</strong> {post.downVote}
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