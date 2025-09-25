import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import AllUserPost from './AllUserPost';
import TagCom from './tags/TagCom';

const MiddleCom = () => {
  const axiosSecure = useAxiosSecure();
  const [sort, setSort] = useState('newest'); // Default sorting: newest
  const [page, setPage] = useState(1); // Current page
  const limit = 10; // Posts per page

  // Fetch all posts with sorting and pagination
  const {
    isPending,
    error,
    data: { posts = [], totalCount = 0 } = {}, // Destructure posts and totalCount
    refetch,
  } = useQuery({
    queryKey: ['allUserPosts', sort, page],
    queryFn: async () => {
      try {
        console.log('Fetching posts with params:', { sort, page, limit });
        const { data } = await axiosSecure.get(`/user/all-post?sort=${sort}&page=${page}&limit=${limit}`);
        console.log('Posts fetched:', data);
        return data; // Expecting { posts, totalCount, currentPage, totalPages }
      } catch (error) {
        console.error('Error fetching posts:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch posts');
      }
    },
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit) || 1;
  console.log('Total pages calculated:', totalPages);
  console.log('Pagination should render:', totalPages > 1);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate pagination buttons with ellipsis
  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5; // Show up to 5 page buttons at a time
    const halfMaxButtons = Math.floor(maxButtons / 2);

    let startPage = Math.max(1, page - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust startPage if endPage is at totalPages
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - maxButtons + 1);
    }

    // Add first page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`join-item btn ${page === 1 ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(1)}
        >
          1
        </button>
      );
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(
        <button key="start-ellipsis" className="join-item btn btn-disabled">
          ...
        </button>
      );
    }

    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`join-item btn ${page === i ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(i)}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      buttons.push(
        <button key="end-ellipsis" className="join-item btn btn-disabled">
          ...
        </button>
      );
    }

    // Add last page
    if (endPage < totalPages) {
      buttons.push(
        <button
          key={totalPages}
          className={`join-item btn ${page === totalPages ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="container mx-auto px-4">
      <TagCom />
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
              {error.message || 'Failed to load posts. Please try again.'}
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
            <AllUserPost key={userPost._id} userPost={userPost} isPending={isPending} error={error} />
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
      <div className="mt-8 flex justify-center items-center gap-2 join">
        {isPending ? (
          <p className="text-gray-700">Loading pagination...</p>
        ) : error ? (
          <p className="text-red-700">Error loading pagination</p>
        ) : totalPages > 1 ? (
          <>
            <button
              className="join-item btn btn-primary"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              Previous
            </button>
            {getPaginationButtons()}
            <button
              className="join-item btn btn-primary"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
            </button>
          </>
        ) : (
          <p className="text-gray-700">No additional pages available.</p>
        )}
      </div>
    </div>
  );
};

export default MiddleCom;