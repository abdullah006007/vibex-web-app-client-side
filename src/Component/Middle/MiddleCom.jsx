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
    const maxButtons = 5; // Show up to 5 page buttons on desktop, 3 on mobile
    const maxButtonsMobile = 3;
    const isMobile = window.innerWidth < 640; // Tailwind's 'sm' breakpoint
    const effectiveMaxButtons = isMobile ? maxButtonsMobile : maxButtons;
    const halfMaxButtons = Math.floor(effectiveMaxButtons / 2);

    let startPage = Math.max(1, page - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + effectiveMaxButtons - 1);

    // Adjust startPage if endPage is at totalPages
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - effectiveMaxButtons + 1);
    }

    // Add first page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`join-item btn btn-sm sm:btn-md ${page === 1 ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(1)}
        >
          1
        </button>
      );
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(
        <button key="start-ellipsis" className="join-item btn btn-sm sm:btn-md btn-disabled">
          ...
        </button>
      );
    }

    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`join-item btn btn-sm sm:btn-md ${page === i ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(i)}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      buttons.push(
        <button key="end-ellipsis" className="join-item btn btn-sm sm:btn-md btn-disabled">
          ...
        </button>
      );
    }

    // Add last page
    if (endPage < totalPages) {
      buttons.push(
        <button
          key={totalPages}
          className={`join-item btn btn-sm sm:btn-md ${page === totalPages ? 'btn-active' : ''}`}
          onClick={() => handlePageClick(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <TagCom />
      {/* Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSort('newest');
              setPage(1); // Reset to first page when changing sort
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors duration-300 ${
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
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors duration-300 ${
              sort === 'popular' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sort by Popularity
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        {isPending ? (
          <div className="min-h-[16rem] flex items-center justify-center rounded-2xl shadow-md bg-gray-50 p-4 sm:p-6 animate-pulse">
            <p className="text-gray-700 text-base sm:text-lg font-semibold">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="min-h-[16rem] flex flex-col items-center justify-center rounded-2xl shadow-md p-4 sm:p-6 bg-red-50">
            <p className="text-red-700 text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">
              {error.message || 'Failed to load posts. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          posts.map((userPost) => (
            <AllUserPost key={userPost._id} userPost={userPost} isPending={isPending} error={error} />
          ))
        ) : (
          <div className="min-h-[16rem] flex items-center justify-center rounded-2xl shadow-md bg-gray-50 p-4 sm:p-6">
            <p className="text-gray-700 text-base sm:text-lg font-semibold text-center">
              No posts available. <br className="sm:hidden" /> Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-2 sm:gap-3 join">
        {isPending ? (
          <p className="text-gray-700 text-sm sm:text-base">Loading pagination...</p>
        ) : error ? (
          <p className="text-red-700 text-sm sm:text-base">Error loading pagination</p>
        ) : totalPages > 1 ? (
          <>
            <button
              className="join-item btn btn-primary btn-sm sm:btn-md"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              Previous
            </button>
            {getPaginationButtons()}
            <button
              className="join-item btn btn-primary btn-sm sm:btn-md"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
            </button>
          </>
        ) : (
          <p className="text-gray-700 text-sm sm:text-base">No additional pages available.</p>
        )}
      </div>
    </div>
  );
};

export default MiddleCom;