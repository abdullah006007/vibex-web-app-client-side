import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUser, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import useAuth from '../../Hooks/useAuth';

const FindConnection = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5; // Users per page

  // Fetch users with pagination
  const { data, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ['public-users', searchTerm, currentPage],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          page: currentPage.toString(),
          limit: limit.toString(),
        });
        const response = await axiosSecure.get(`/public-users?${params.toString()}`);
       
        return response.data;
      } catch (err) {
        console.error('Error fetching users:', err.response?.data || err.message);
        throw new Error(err.response?.data?.error || 'Failed to fetch users');
      }
    },
    enabled: !!authUser?.email && !authLoading,
  });

  // Destructure paginated data
  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  // Fetch connections
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
    queryKey: ['connections', authUser?.email],
    queryFn: async () => {
      try {
        const response = await axiosSecure.get(`/connections/${authUser?.email}`);

        return response.data;
      } catch (err) {
        console.error('Error fetching connections:', err.response?.data || err.message);
        return [];
      }
    },
    enabled: !!authUser?.email && !authLoading,
  });

  // Mutation for sending connection request
  const connectMutation = useMutation({
    mutationFn: async ({ fromEmail, toEmail, userName }) => {
      const response = await axiosSecure.post('/connections', { fromEmail, toEmail });
      return { userName, ...response.data };
    },
    onSuccess: (data) => {
      toast.success(`Connection request sent to ${data.userName}!`);
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries(['connections', authUser?.email]);
      queryClient.invalidateQueries(['public-users', searchTerm, currentPage]);
    },
    onError: (err) => {
      console.error('Error sending connection request:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to send connection request');
    },
  });

  // Handle Connect button click
  const handleConnect = (toEmail, userName) => {
    if (!authUser?.email) {
      console.error('No authenticated user email');
      return;
    }


    connectMutation.mutate({ fromEmail: authUser.email, toEmail, userName });
  };

  // Get connection status for a user
  const getConnectionStatus = (toEmail) => {
    const connection = connections.find(
      (conn) => (conn.fromEmail === authUser?.email && conn.toEmail === toEmail) ||
                (conn.fromEmail === toEmail && conn.toEmail === authUser?.email)
    );
    return connection ? connection.status : null;
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle image load error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-sm mx-auto">
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out;
          }
          .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .hover-lift:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .connect-button {
            min-width: 80px;
            text-align: center;
          }
        `}
      </style>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 fade-in">
        Find Connections
      </h3>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users..."
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
          />
        </div>
      </div>

      {/* Loading State */}
      {(isUsersLoading || isConnectionsLoading || authLoading) && (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {usersError && (
        <div className="text-center text-red-500 text-sm fade-in">
          <p>{usersError.message}</p>
        </div>
      )}

      {/* Users List */}
      {!isUsersLoading && !isConnectionsLoading && !authLoading && !usersError && users.length === 0 && (
        <div className="text-center text-gray-500 text-sm fade-in">
          <p>No users found</p>
        </div>
      )}

      {!isUsersLoading && !isConnectionsLoading && !authLoading && !usersError && users.length > 0 && (
        <div className="space-y-3 fade-in">
          {users.map((user) => {
            const connectionStatus = getConnectionStatus(user.email);
            const isCurrentUser = authUser?.email && user.email.toLowerCase() === authUser.email.toLowerCase();
            const isPending = connectionStatus === 'pending';
            const buttonText = isCurrentUser ? 'You' : isPending ? 'Pending' : 'Connect';
            const buttonStyles = isCurrentUser || isPending
              ? 'bg-gray-300 text-gray-600 opacity-50 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700';

           

            return (
              <div
                key={user.email}
                className="flex items-center bg-gray-50 rounded-md p-3 border border-purple-100/50 hover-lift"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-100 mr-3">
                  {user.photoURL ? (
                    <>
                      <img
                        src={user.photoURL}
                        alt={user.name || user.username}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-gray-200"
                        style={{ display: 'none' }}
                      >
                        <FaUser className="text-gray-400 text-xl" />
                      </div>
                    </>
                  ) : (
                    <FaUser className="text-gray-400 text-xl w-full h-full flex items-center justify-center" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.name || user.username || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.bio || 'No bio'}</p>
                  <p className="text-xs text-gray-400">{user.Badge || 'Bronze'} Badge</p>
                </div>
                <button
                  onClick={() => !isCurrentUser && !isPending && handleConnect(user.email, user.name || user.username || 'Anonymous')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors hover-lift connect-button ${buttonStyles}`}
                  disabled={isCurrentUser || isPending || connectMutation.isLoading}
                >
                  {connectMutation.isLoading && user.email === connectMutation.variables?.toEmail ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    buttonText
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isUsersLoading && !isConnectionsLoading && !authLoading && !usersError && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 fade-in">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 rounded-md"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage <= 3 ? i + 1 : currentPage > totalPages - 3 ? totalPages - 4 + i : currentPage - 2 + i;
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
    </div>
  );
};

export default FindConnection;