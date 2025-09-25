import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuth from '../../../Hooks/useAuth';
import useAxiosSecure from '../../../Hooks/useAxiosSecure';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57', '#8884D8'];

const tagOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health' },
    { value: 'business', label: 'Business' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'science', label: 'Science' },
    { value: 'finance', label: 'Finance' },
    { value: 'politics', label: 'Politics' },
    { value: 'environment', label: 'Environment' },
    { value: 'art', label: 'Art' },
    { value: 'history', label: 'History' },
];

const AdminProfile = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  // Fetch admin profile data
  const { data: adminData, isLoading, error } = useQuery({
    queryKey: ['adminProfile', user?.email],
    queryFn: async () => {
      const response = await axiosSecure.get('/admin/profile');
      return response.data;
    },
    enabled: !!user?.email,
  });

  // Fetch existing tags
  const { data: existingTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axiosSecure.get('/tags');
      return response.data;
    },
  });

  // Form for adding custom tags
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const addTagMutation = useMutation({
    mutationFn: async (tagData) => {
      const response = await axiosSecure.post('/tags', tagData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tag added successfully!');
      reset();
      queryClient.invalidateQueries(['tags']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add tag');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagName) => {
      const response = await axiosSecure.delete(`/tags/${tagName}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tag deleted successfully!');
      queryClient.invalidateQueries(['tags']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete tag');
    },
  });

  const onSubmit = (data) => {
    addTagMutation.mutate({ name: data.tagName });
  };

  const handleAddSuggestedTag = (tagValue) => {
    addTagMutation.mutate({ name: tagValue });
  };

  const handleDeleteTag = (tagName) => {
    deleteTagMutation.mutate(tagName);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error loading profile: {error.message}</div>;
  }

  // Pie data
  const pieData = [
    { name: 'Posts', value: adminData.totalPosts },
    { name: 'Comments', value: adminData.totalComments },
    { name: 'Users', value: adminData.totalUsers },
  ];

  // Bar data for site-wide stats
  const barData = [
    { name: 'Users', value: adminData.totalUsers },
    { name: 'Posts', value: adminData.totalPosts },
    { name: 'Comments', value: adminData.totalComments },
    { name: 'Likes', value: adminData.totalUpVotes },
    { name: 'Dislikes', value: adminData.totalDownVotes },
    { name: 'Reports', value: adminData.totalReports },
    { name: 'Notifications', value: adminData.totalNotifications },
  ];

  // Prepare line chart data
  const recentActivity = adminData.recentActivity || { posts: [], users: [], comments: [] };
  const allDates = [...new Set([
    ...recentActivity.posts.map(p => p.date),
    ...recentActivity.users.map(u => u.date),
    ...recentActivity.comments.map(c => c.date)
  ])].sort();
  const lineData = allDates.map(date => ({
    date,
    posts: recentActivity.posts.find(p => p.date === date)?.posts || 0,
    users: recentActivity.users.find(u => u.date === date)?.users || 0,
    comments: recentActivity.comments.find(c => c.date === date)?.comments || 0,
  }));

  // Suggested tags not yet added
  const suggestedTags = tagOptions.filter(opt => !existingTags.includes(opt.value.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">Admin Profile Dashboard</h1>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md">
          <img
            src={adminData.image}
            alt={adminData.name}
            className="w-40 h-40 rounded-full mb-4 object-cover border-4 border-indigo-300 shadow-lg"
          />
          <h2 className="text-3xl font-bold text-gray-900">{adminData.name}</h2>
          <p className="text-gray-600 text-lg">{adminData.email}</p>
        </div>

        {/* Charts Section - Horizontal on large screens, stacked on small */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Site Overview (Pie)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Key Metrics (Bar)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Recent Activity (Line)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="posts" stroke="#0088FE" name="Posts" />
                <Line type="monotone" dataKey="users" stroke="#00C49F" name="New Users" />
                <Line type="monotone" dataKey="comments" stroke="#FFBB28" name="Comments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Sections - Data below charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Box: Personal Stats */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-center text-blue-800">Personal Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">My Posts</p>
                <p className="text-3xl text-blue-600 font-bold">{adminData.posts}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">My Comments</p>
                <p className="text-3xl text-blue-600 font-bold">{adminData.comments}</p>
              </div>
            </div>
          </div>

          {/* Right Box: Site Stats */}
          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-center text-green-800">Site-Wide Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Users</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalUsers}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Posts</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalPosts}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Comments</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalComments}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Likes</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalUpVotes}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Dislikes</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalDownVotes}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Reports</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalReports}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Notifications</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalNotifications}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Announcements</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalAnnouncements}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Admins</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalAdmins}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center transform hover:scale-105 transition-transform">
                <p className="font-bold text-gray-700">Total Premium Users</p>
                <p className="text-3xl text-green-600 font-bold">{adminData.totalPremium}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Management Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-800">Tag Management</h2>
          
          {/* Existing Tags Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3 text-center text-indigo-700">Existing Tags</h3>
            {existingTags.length === 0 ? (
              <p className="text-center text-gray-600">No tags added yet.</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {existingTags.map((tag) => (
                  <div key={tag} className="flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                    <span className="mr-2 capitalize">{tag}</span>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      className="text-red-600 hover:text-red-800 font-bold"
                      disabled={deleteTagMutation.isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Suggested Tags Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3 text-center text-indigo-700">Suggested Tags (Click to Add)</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {tagOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAddSuggestedTag(opt.value)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    existingTags.includes(opt.value.toLowerCase())
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                  }`}
                  disabled={addTagMutation.isLoading || existingTags.includes(opt.value.toLowerCase())}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Tag Form */}
          <h3 className="text-lg font-medium mb-3 text-center text-indigo-700">Add Custom Tag</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 justify-center">
            <input
              {...register('tagName', { required: true })}
              placeholder="Enter custom tag name"
              className="flex-1 max-w-md p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors" disabled={addTagMutation.isLoading}>
              {addTagMutation.isLoading ? 'Adding...' : 'Add Custom Tag'}
            </button>
          </form>
          {errors.tagName && <p className="text-red-500 mt-2 text-center">Tag name is required</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;