import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import Logo from '../LogoFile/Logo';
import { IoIosNotifications } from 'react-icons/io';
import useAuth from '../../../Hooks/useAuth';
import Spinner from '../Spinner/Spinner';
import toast from 'react-hot-toast';
import { CiSearch } from 'react-icons/ci';
import useAxiosSecure from '../../../Hooks/useAxiosSecure';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Navbar = () => {
  const { user, loading, logOut } = useAuth();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // Normalize email to match backend
  const normalizedEmail = user?.email?.toLowerCase().trim();
  console.log(`Navbar: User email=${normalizedEmail}, loading=${loading}`);

  // Fetch unread notifications for badge
  const { data: unreadNotifications = [], isLoading: unreadLoading, error: unreadError } = useQuery({
    queryKey: ['unreadNotifications', normalizedEmail],
    queryFn: async () => {
      if (!normalizedEmail) {
        console.warn('No email provided for unread notifications fetch');
        return [];
      }
      console.log(`Fetching unread notifications for ${normalizedEmail}`);
      const response = await axiosSecure.get(`/notifications/${normalizedEmail}`);
      console.log(`Fetched ${response.data.length} unread notifications`);
      return response.data;
    },
    enabled: !!normalizedEmail && !loading,
    refetchOnWindowFocus: true,
  });

  // Fetch all notifications (read + unread) for "All Announcements" modal
  const { data: allNotifications = [], isLoading: allLoading, error: allError } = useQuery({
    queryKey: ['allNotifications', normalizedEmail],
    queryFn: async () => {
      if (!normalizedEmail) {
        console.warn('No email provided for all notifications fetch');
        return [];
      }
      console.log(`Fetching all notifications for ${normalizedEmail}`);
      const response = await axiosSecure.get(`/notifications/${normalizedEmail}?all=true`);
      console.log(`Fetched ${response.data.length} all notifications`);
      return response.data;
    },
    enabled: !!normalizedEmail && !loading,
    refetchOnWindowFocus: true,
  });

  // Mutation to mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      console.log(`Marking notification ${notificationId} as read`);
      return await axiosSecure.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      console.log('Notification marked as read successfully');
      queryClient.invalidateQueries(['unreadNotifications', normalizedEmail]);
      queryClient.invalidateQueries(['allNotifications', normalizedEmail]);
      toast.success('Notification marked as read', { position: 'top-right' });
    },
    onError: (err) => {
      console.error('Error marking notification as read:', err);
      toast.error(err.response?.data?.message || 'Failed to mark notification as read', {
        position: 'top-right',
      });
    },
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!normalizedEmail) throw new Error('No email');
      console.log(`Marking all notifications as read for ${normalizedEmail}`);
      return await axiosSecure.patch(`/notifications/${normalizedEmail}/read-all`);
    },
    onSuccess: () => {
      console.log('All notifications marked as read successfully');
      toast.success('All notifications marked as read', { position: 'top-right' });
      queryClient.invalidateQueries(['unreadNotifications', normalizedEmail]);
      queryClient.invalidateQueries(['allNotifications', normalizedEmail]);
    },
    onError: (err) => {
      console.error('Error marking all notifications as read:', err);
      toast.error(err.response?.data?.message || 'Failed to mark all as read', {
        position: 'top-right',
      });
    },
  });

  // Error handling
  useEffect(() => {
    if (unreadError) {
      console.error('Unread notifications error:', unreadError);
      toast.error('Failed to load notifications: ' + (unreadError.message || 'Unknown error'), {
        position: 'top-right',
      });
    }
    if (allError) {
      console.error('All notifications error:', allError);
      toast.error('Failed to load all notifications: ' + (allError.message || 'Unknown error'), {
        position: 'top-right',
      });
    }
  }, [unreadError, allError]);

  if (loading || unreadLoading || allLoading) {
    console.log('Rendering spinner due to loading state');
    return <Spinner />;
  }

  const navItem = (
    <>
      <li><NavLink to="/" className={({ isActive }) => isActive ? 'text-primary font-semibold' : ''}>Home</NavLink></li>
      <li><NavLink to="/membership" className={({ isActive }) => isActive ? 'text-primary font-semibold' : ''}>Membership</NavLink></li>
      <li><NavLink to="/join-us" className={({ isActive }) => isActive ? 'text-primary font-semibold' : ''}>Join Us</NavLink></li>
      <li><NavLink to="/about" className={({ isActive }) => isActive ? 'text-primary font-semibold' : ''}>About Us</NavLink></li>
    </>
  );

  const handleSignOut = () => {
    console.log(`Logging out user: ${normalizedEmail}`);
    logOut()
      .then(() => {
        toast.success('Logged out successfully', { position: 'top-right' });
        setShowDropdown(false);
        navigate('/login');
      })
      .catch((err) => {
        console.error('Logout error:', err);
        toast.error('Failed to log out: ' + err.message, { position: 'top-right' });
      });
  };

  const toggleDropdown = () => {
    console.log(`Toggling dropdown: ${!showDropdown}`);
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = () => {
    console.log('Opening notification modal');
    setShowNotificationModal(true);
  };

  const handleMarkAllRead = () => {
    console.log('Marking all notifications as read');
    markAllAsReadMutation.mutate();
  };

  return (
    <div className="bg-base-100 shadow-md sticky top-0 z-50">
      <div className="navbar container mx-auto">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow">
              {navItem}
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <Logo />
            <p className="text-xl font-bold text-primary">VIBEX</p>
          </div>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            {navItem}
          </ul>
        </div>
        <div className="navbar-end flex items-center gap-4">
         
          <div className="relative cursor-pointer" title="Notifications">
            <IoIosNotifications
              className="text-primary hover:text-primary-dark transition-colors"
              size={30}
              onClick={handleNotificationClick}
            />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <button onClick={handleSignOut} className="btn bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-md">
                Log Out
              </button>
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-primary transition-colors"
                  onClick={toggleDropdown}
                >
                  <img
                    src={user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png'}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 font-semibold">
                      {user?.displayName || 'User'}
                    </div>
                    <Link
                      to="/dashboard/update-profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Update Profile
                    </Link>
                    <Link
                      to="/dashboard/home"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login">
                <button className="btn bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-md">Login</button>
              </Link>
              <Link to="/register">
                <button className="btn bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-md">Register</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Notifications ({unreadNotifications.length})</h2>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
                </button>
              )}
            </div>
            {unreadLoading ? (
              <p className="text-gray-600">Loading notifications...</p>
            ) : unreadNotifications.length === 0 ? (
              <p className="text-gray-600">No unread notifications.</p>
            ) : (
              <div className="space-y-4">
                {unreadNotifications.map((notification) => (
                  <div key={notification._id} className="border p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {notification.authorImage && (
                          <img
                            src={notification.authorImage}
                            alt="Author"
                            className="w-12 h-12 rounded-full object-cover mb-2"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <h3 className="text-xl font-semibold text-gray-800">{notification.title}</h3>
                        <p className="text-gray-600 mt-2 whitespace-pre-wrap">{notification.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Posted on: {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsReadMutation.mutate(notification._id)}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                        disabled={markAsReadMutation.isPending}
                      >
                        {markAsReadMutation.isPending ? 'Marking...' : 'Mark as Read'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-between mt-6">
              <button
                onClick={() => setShowAllAnnouncements(true)}
                className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl flex-1 sm:flex-none"
                disabled={allNotifications.length === 0}
              >
                View All ({allNotifications.length})
              </button>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="btn bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Notifications Modal */}
      {showAllAnnouncements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">All Notifications ({allNotifications.length})</h2>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
                </button>
              )}
            </div>
            {allLoading ? (
              <p className="text-gray-600">Loading notifications...</p>
            ) : allNotifications.length === 0 ? (
              <p className="text-gray-600">No notifications found.</p>
            ) : (
              <div className="space-y-4">
                {allNotifications.map((notification) => (
                  <div key={notification._id} className="border p-4 rounded-xl shadow-sm">
                    {notification.authorImage && (
                      <img
                        src={notification.authorImage}
                        alt="Author"
                        className="w-12 h-12 rounded-full object-cover mb-2"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <h3 className="text-xl font-semibold text-gray-800">{notification.title}</h3>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{notification.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Posted by: {notification.authorName || 'Unknown'}</p>
                      <p>Posted on: {new Date(notification.createdAt).toLocaleDateString()}</p>
                      {notification.read && <p className="text-green-600">Read</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAllAnnouncements(false)}
                className="btn bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;