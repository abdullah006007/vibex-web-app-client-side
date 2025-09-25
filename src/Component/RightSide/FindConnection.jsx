import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FaUser, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import useAuth from '../../Hooks/useAuth';

const FindConnection = () => {
  const { user: authUser, loading: authLoading } = useAuth(); // Renamed to authUser to avoid naming conflict
  const axiosSecure = useAxiosSecure();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleUsers, setVisibleUsers] = useState(5);

  // Fetch users
  const { data: users = [], isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ['public-users', searchTerm],
    queryFn: async () => {
      try {
        const response = await axiosSecure.get(`/public-users?search=${encodeURIComponent(searchTerm)}`);
        console.log('Fetched users:', response.data); // Debug log
        return response.data;
      } catch (err) {
        console.error('Error fetching users:', err.response?.data || err.message);
        throw new Error(err.response?.data?.error || 'Failed to fetch users');
      }
    },
    enabled: !!authUser?.email && !authLoading,
  });

  // Fetch connections
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
    queryKey: ['connections', authUser?.email],
    queryFn: async () => {
      try {
        const response = await axiosSecure.get(`/connections/${authUser?.email}`);
        console.log('Fetched connections:', response.data); // Debug log
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
    console.log('Sending connection request:', { fromEmail: authUser.email, toEmail, userName }); // Debug log
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
    setVisibleUsers(5);
  };

  // Load more users
  const handleLoadMore = () => {
    setVisibleUsers((prev) => prev + 5);
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
          {users.slice(0, visibleUsers).map((user) => {
            const connectionStatus = getConnectionStatus(user.email);
            const isCurrentUser = authUser?.email && user.email.toLowerCase() === authUser.email.toLowerCase();
            const isPending = connectionStatus === 'pending';
            const buttonText = isCurrentUser ? 'You' : isPending ? 'Pending' : 'Connect';
            const buttonStyles = isCurrentUser || isPending
              ? 'bg-gray-300 text-gray-600 opacity-50 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700';

            console.log('User check:', { userEmail: user.email, authUserEmail: authUser?.email, isCurrentUser, connectionStatus }); // Debug log

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

      {/* Load More Button */}
      {!isUsersLoading && !isConnectionsLoading && !authLoading && !usersError && users.length > visibleUsers && (
        <div className="mt-4 text-center fade-in">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors hover-lift"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default FindConnection;