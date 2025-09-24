import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import AllUserPost from './AllUserPost';

const MiddleCom = () => {
  const axiosSecure = useAxiosSecure();
  const [sort, setSort] = useState('newest'); // Default sorting: newest
  const [page, setPage] = useState(1); // Current page
  const limit = 5; // Posts per page

  // Fetch total post count for pagination
  const { data: totalCount = { count: 0 } } = useQuery({
    queryKey: ['postsCount'],
    queryFn: async () => {
      try {
        const { data } = await axiosSecure.get('/user/posts/count');
        return data;
      } catch (error) {
        console.error('Error fetching posts count:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch posts count');
      }
    },
  });

  // Fetch all posts with sorting and pagination
  const {
    isPending,
    error,
    data: posts = [],
    refetch,
  } = useQuery({
    queryKey: ['allUserPosts', sort, page],
    queryFn: async () => {
      try {
        const { data } = await axiosSecure.get(`/user/all-post?sort=${sort}&page=${page}&limit=${limit}`);
        return data;
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch posts');
      }
    },
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalCount.count / limit);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sorting Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setSort('newest');
              setPage(1); // Reset to first page when changing sort
            }}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              sort === 'newest' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sort by Newest
          </button>
          <button
            onClick={() => {
              setSort('popular');
              setPage(1); // Reset to first page when changing sort
            }}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              sort === 'popular' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sort by Popularity
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="mt-8 space-y-6">
        {isPending ? (
          <div className="min-h-64 flex items-center justify-center rounded-2xl shadow-xl animate-pulse">
            <p className="text-gray-700 text-xl font-semibold">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="min-h-64 flex flex-col items-center justify-center rounded-2xl shadow-xl p-6 bg-red-50">
            <p className="text-red-700 text-xl font-semibold mb-4">
              {error.message || 'Failed to load posts'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          posts.map((userPost) => (
            <AllUserPost key={userPost._id} userPost={userPost} />
          ))
        ) : (
          <div className="min-h-64 flex items-center justify-center rounded-2xl shadow-xl">
            <p className="text-gray-700 text-xl font-semibold text-center">
              No posts available. <br /> Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageClick(pageNumber)}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                page === pageNumber ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              page === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MiddleCom;