import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaSearch, FaArrowRight, FaArrowLeft, FaArrowUp, FaArrowDown, FaPaperPlane, FaRegComment, FaReply, FaShare } from 'react-icons/fa';
import Modal from 'react-modal';
import useAxiosSecure from '../../../Hooks/useAxiosSecure';
import useAuth from '../../../Hooks/useAuth';
import { FacebookShareButton, FacebookIcon } from 'react-share';

Modal.setAppElement('#root'); // Set the app element for accessibility

const TagCom = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { displayName, photoURL, email } = user || {};
  const [searchTag, setSearchTag] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // For "View All Posts" modal
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // For individual post modal
  const [selectedPost, setSelectedPost] = useState(null); // Selected post for modal
  const [startIndex, setStartIndex] = useState(0); // Track current set of posts
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [commentSort, setCommentSort] = useState('newest'); // Sort comments by newest or popularity
  const postsPerPage = 3; // Show 3 posts at a time

  // Fetch available tags from API
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axiosSecure.get('/tags');
      return response.data;
    },
  });

  // Fetch all posts
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await axiosSecure.get('/posts');
      return response.data;
    },
  });

  // Get current set of posts (3 at a time)
  const currentPosts = allPosts.slice(startIndex, startIndex + postsPerPage);

  // Memoized sorted comments for the selected post
  const sortedComments = useMemo(() => {
    if (!selectedPost?.comments) return [];
    let comments = [...selectedPost.comments];
    if (commentSort === 'newest') {
      return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (commentSort === 'popularity') {
      return comments.sort((a, b) => (b.upVote - b.downVote) - (a.upVote - a.downVote));
    }
    return comments;
  }, [selectedPost?.comments, commentSort]);

  // Mutations for post interactions
  const upvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to upvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts', 'selectedPost']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to upvote post.');
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) throw new Error('You must be logged in to downvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts', 'selectedPost']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to downvote post.');
    },
  });

  const commentUpvoteMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!user) throw new Error('You must be logged in to upvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['selectedPost']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to upvote comment.');
    },
  });

  const commentDownvoteMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!user) throw new Error('You must be logged in to downvote.');
      const response = await axiosSecure.put(`/user/post/${postId}/comment/${commentId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['selectedPost']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to downvote comment.');
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
      queryClient.invalidateQueries(['posts', 'selectedPost']);
      setCommentText('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to post comment.');
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
      queryClient.invalidateQueries(['selectedPost']);
      setReplyText('');
      setReplyToCommentId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to post reply.');
    },
  });

  const queryClient = useQueryClient();

  // Handle navigation to next/previous posts
  const handleNextPosts = () => {
    if (startIndex + postsPerPage < allPosts.length) {
      setStartIndex(startIndex + postsPerPage);
    }
  };

  const handlePrevPosts = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - postsPerPage);
    }
  };

  // Handle search by tag
  const handleSearch = async (tag = searchTag) => {
    if (!tag) {
      toast.error('Please enter or select a tag to search');
      return;
    }

    try {
      const response = await axiosSecure.get(`/posts/search?tag=${tag.toLowerCase()}`);
      setSearchResults(response.data);
      setSearchTag(tag);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to search posts';
      toast.error(errorMessage);
      setSearchResults([]);
    }
  };

  // Handle tag click
  const handleTagClick = (tag) => {
    setSearchTag(tag);
    handleSearch(tag);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Handle view post
  const handleViewPost = async (postId) => {
    try {
      const response = await axiosSecure.get(`/user/post/${postId}`);
      setSelectedPost(response.data);
      setIsPostModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch post details');
    }
  };

  // Handle modal open/close
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const closePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
    setCommentText('');
    setReplyText('');
    setReplyToCommentId(null);
    setCommentSort('newest');
  };

  // Handle post interactions
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
      commentMutation.mutate({ postId: selectedPost._id, comment: commentText });
    }
  };

  const handleReplySubmit = (commentId, e) => {
    e.stopPropagation();
    if (replyText.trim()) {
      replyMutation.mutate({ postId: selectedPost._id, commentId, reply: replyText });
    }
  };

  // Handle image load error
  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/150?text=Error';
  };

  // Share URL and title for social sharing
  const shareUrl = window.location.href;
  const shareTitle = selectedPost?.postTitle || 'Check out this post!';

  // Render loading state for auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-gray-700 text-xl font-semibold">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <style>
        {`
          @keyframes slideInFromRight {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .post-card {
            animation: slideInFromRight 0.5s ease-out forwards;
          }
          .modal-content {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>

      {/* Banner Section with Compact Search Bar */}
      <div className="relative bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white py-8 px-4 rounded-b-lg shadow-lg">
        <div className="absolute inset-0 bg-opacity-20 bg-black z-0" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Discover Posts by Tag</h1>
          <form onSubmit={handleSubmit} className="flex justify-center items-center gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Search by tag..."
                className="w-full py-3 pl-10 pr-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-300/50 transition-all duration-300 bg-white/95 shadow-lg"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-800 hover:to-pink-700 transition-all duration-300 shadow-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* All Tags Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Available Tags</h2>
        {tagsLoading ? (
          <p className="text-center text-gray-600">Loading tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-center text-gray-600">No tags available.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-900 px-4 py-2 rounded-full hover:from-indigo-300 hover:to-purple-300 transition-all duration-300 capitalize text-sm font-semibold shadow-md"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Section */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          {searchResults.length > 0 ? `Posts for "${searchTag}"` : searchTag ? 'No Results Found' : 'Search Results'}
        </h2>
        {searchResults.length === 0 && searchTag && (
          <p className="text-center text-gray-600 mb-6">No posts found for this tag.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((post) => (
            <div
              key={post._id}
              className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500 border border-purple-100/50 post-card"
            >
              {post.postPhoto && (
                <div className="relative">
                  <img
                    src={post.postPhoto}
                    alt={post.postTitle}
                    className="w-full h-56 object-cover transition-transform duration-500 hover:scale-110"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3 line-clamp-2 leading-tight tracking-tight">
                  {post.postTitle}
                </h3>
                <p className="text-gray-700 mb-4 text-base line-clamp-3 leading-relaxed">{post.postDescription}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-900 px-3 py-1 rounded-full font-semibold capitalize shadow-sm">
                    {post.tag}
                  </span>
                  <div className="flex gap-4">
                    <span className="text-sm text-gray-600 font-semibold flex items-center">
                      <span className="mr-1">👍</span> {post.upVote}
                    </span>
                    <span className="text-sm text-gray-600 font-semibold flex items-center">
                      <span className="mr-1">👎</span> {post.downVote}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 italic font-medium">By {post.authorName}</p>
                  <button
                    onClick={() => handleViewPost(post._id)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    View Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Newest Posts Section with Navigation */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Top Newest Posts</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPosts}
              disabled={startIndex === 0}
              className={`p-2 rounded-full text-white font-semibold transition-all duration-300 shadow-md ${
                startIndex === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={handleNextPosts}
              disabled={startIndex + postsPerPage >= allPosts.length}
              className={`p-2 rounded-full text-white font-semibold transition-all duration-300 shadow-md ${
                startIndex + postsPerPage >= allPosts.length ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <FaArrowRight />
            </button>
            <button
              onClick={openModal}
              className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-700 transition-all duration-300 shadow-md"
            >
              View All Posts
            </button>
          </div>
        </div>
        {postsLoading ? (
          <p className="text-center text-gray-600">Loading posts...</p>
        ) : currentPosts.length === 0 ? (
          <p className="text-center text-gray-600">No posts available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPosts.map((post) => (
              <div
                key={post._id}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm overflow-hidden transform hover:scale-105 hover:shadow-sm transition-all duration-500 border border-purple-100/50 post-card"
              >
                {post.postPhoto && (
                  <div className="relative ">
                    <img
                      src={post.postPhoto}
                      alt={post.postTitle}
                      className="w-full h-28 object-cover transition-transform duration-500 hover:scale-110"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-sm  text-gray-500 mb-3 line-clamp-2 leading-tight tracking-tight">
                    {post.postTitle}
                  </h3>
                 
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-900 px-3 py-1 rounded-full font-semibold capitalize shadow-sm">
                      {post.tag}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-sm text-gray-600 font-semibold flex items-center">
                        <span className="mr-1">👍</span> {post.upVote}
                      </span>
                      <span className="text-sm text-gray-600 font-semibold flex items-center">
                        <span className="mr-1">👎</span> {post.downVote}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                   
                    <button
                      onClick={() => handleViewPost(post._id)}
                      className="bg-gradient-to-r from-indigo-600 cursor-pointer to-purple-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Posts Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="All Posts"
        className="max-w-5xl mx-auto mt-16 bg-white rounded-lg shadow-xl p-6 max-h-[80vh] overflow-y-auto modal-content"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">All Posts</h2>
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {postsLoading ? (
          <p className="text-center text-gray-600">Loading posts...</p>
        ) : allPosts.length === 0 ? (
          <p className="text-center text-gray-600">No posts available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => (
              <div
                key={post._id}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500 border border-purple-100/50"
              >
                {post.postPhoto && (
                  <div className="relative">
                    <img
                      src={post.postPhoto}
                      alt={post.postTitle}
                      className="w-full h-56 object-cover transition-transform duration-500 hover:scale-110"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3 line-clamp-2 leading-tight tracking-tight">
                    {post.postTitle}
                  </h3>
                  <p className="text-gray-700 mb-4 text-base line-clamp-3 leading-relaxed">{post.postDescription}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-900 px-3 py-1 rounded-full font-semibold capitalize shadow-sm">
                      {post.tag}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-sm text-gray-600 font-semibold flex items-center">
                        <span className="mr-1">👍</span> {post.upVote}
                      </span>
                      <span className="text-sm text-gray-600 font-semibold flex items-center">
                        <span className="mr-1">👎</span> {post.downVote}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 italic font-medium">By {post.authorName}</p>
                    <button
                      onClick={() => handleViewPost(post._id)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      View Post
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Individual Post Modal */}
      {selectedPost && (
        <Modal
          isOpen={isPostModalOpen}
          onRequestClose={closePostModal}
          contentLabel="Post Details"
          className="max-w-3xl w-[90%] mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-2xl p-8 outline-none max-h-[80vh] overflow-y-auto modal-content"
          overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center"
        >
          <div className="flex flex-col gap-6">
            {/* Full Post Content */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
              <div className="relative">
                <img
                  src={selectedPost.authorImage || 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png'}
                  alt={selectedPost.authorName || 'Anonymous'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gradient-to-br from-blue-200 to-purple-300 shadow-lg"
                  onError={(e) => {
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png';
                    e.target.onerror = null;
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedPost.postTitle || 'Untitled Post'}</h2>
                  <p className="text-gray-700 mb-4">{selectedPost.postDescription || 'No description available.'}</p>
                  {selectedPost.postPhoto && (
                    <div className="mt-4">
                      <img
                        src={selectedPost.postPhoto}
                        alt={selectedPost.postTitle || 'Post Image'}
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
                      <strong className="text-gray-800">Tag:</strong> {selectedPost.tag || 'Lifestyle'}
                    </p>
                    <p>
                      <strong className="text-gray-800">Posted:</strong>{' '}
                      {new Date(selectedPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p>
                      <strong className="text-gray-800">Comments:</strong> {selectedPost.comments?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-6">
                  <button
                    onClick={(e) => handleUpvote(selectedPost._id, e)}
                    className="flex items-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                    title="Upvote"
                    disabled={upvoteMutation.isLoading || !user}
                  >
                    <FaArrowUp /> <span className="font-medium">{selectedPost.upVote || 0}</span>
                  </button>
                  <button
                    onClick={(e) => handleDownvote(selectedPost._id, e)}
                    className="flex items-center gap-2 px-5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                    title="Downvote"
                    disabled={downvoteMutation.isLoading || !user}
                  >
                    <FaArrowDown /> <span className="font-medium">{selectedPost.downVote || 0}</span>
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
                sortedComments.map((comment) => (
                  <div key={comment._id} className="border-t py-4">
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
                    <div className="mt-2 flex items-center gap-6">
                      <button
                        onClick={(e) => handleCommentUpvote(selectedPost._id, comment._id, e)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300 disabled:opacity-50"
                        title="Upvote comment"
                        disabled={commentUpvoteMutation.isLoading || !user}
                      >
                        <FaArrowUp /> <span className="font-medium">{comment.upVote || 0}</span>
                      </button>
                      <button
                        onClick={(e) => handleCommentDownvote(selectedPost._id, comment._id, e)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                        title="Downvote comment"
                        disabled={commentDownvoteMutation.isLoading || !user}
                      >
                        <FaArrowDown /> <span className="font-medium">{comment.downVote || 0}</span>
                      </button>
                    </div>
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
                            replyText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                          }`}
                          disabled={replyMutation.isLoading || !replyText.trim()}
                        >
                          <FaPaperPlane />
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
                disabled={!user}
              />
              <button
                onClick={handleCommentSubmit}
                className={`p-3 rounded-lg transition-colors duration-300 ${
                  commentText.trim() && user ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                }`}
                disabled={commentMutation.isLoading || !commentText.trim() || !user}
              >
                <FaPaperPlane />
              </button>
            </div>
            <button
              onClick={closePostModal}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 self-end"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TagCom;