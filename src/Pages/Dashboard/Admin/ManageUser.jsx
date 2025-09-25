import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Shield, XCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import useAxiosSecure from "../../../Hooks/useAxiosSecure";
import useAuth from "../../../Hooks/useAuth";

const ManageUser = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth(); // logged-in admin
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null); // for confirmation modal
  const limit = 10; // Number of users per page

  // === Fetch Users ===
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", search, currentPage],
    queryFn: async () => {
      const res = await axiosSecure.get(`/users?search=${search}&page=${currentPage}&limit=${limit}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Destructure users and pagination data
  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const currentPageFromApi = data?.currentPage || 1;

  // === Make Admin Mutation ===
  const makeAdminMutation = useMutation({
    mutationFn: async (id) => axiosSecure.patch(`/users/make-admin/${id}`),
    onSuccess: () => {
      toast.success("User promoted to admin successfully!");
      queryClient.invalidateQueries(["users", search, currentPage]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to promote user");
    },
  });

  // === Remove Admin Mutation ===
  const removeAdminMutation = useMutation({
    mutationFn: async (id) => axiosSecure.patch(`/users/remove-admin/${id}`),
    onSuccess: () => {
      toast.success("Admin removed successfully!");
      queryClient.invalidateQueries(["users", search, currentPage]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove admin");
    },
  });

  // === Delete User Mutation ===
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => axiosSecure.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted successfully!");
      setConfirmDeleteUser(null);
      queryClient.invalidateQueries(["users", search, currentPage]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    },
  });

  // === Handlers ===
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    refetch();
  };

  const handleMakeAdmin = (id) => makeAdminMutation.mutate(id);
  const handleRemoveAdmin = (id) => removeAdminMutation.mutate(id);
  const handleDeleteUser = (id) => deleteUserMutation.mutate(id);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      refetch();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Manage Users</h2>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 mb-6 max-w-md mx-auto"
      >
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Subscription</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-red-500">
                  {error.message || "Failed to load users"}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = currentUser?.email === user.email;

                return (
                  <tr key={user._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{user.username || "N/A"}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.subscription || "Free"}</td>
                    <td className="p-3 capitalize">{user.role || "user"}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      {/* Make / Remove Admin */}
                      {user.role === "admin" ? (
                        <button
                          onClick={() => handleRemoveAdmin(user._id)}
                          disabled={removeAdminMutation.isLoading || isSelf}
                          title={
                            isSelf
                              ? "You cannot remove yourself from admin"
                              : "Remove Admin"
                          }
                          className="px-4 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {removeAdminMutation.isLoading && !isSelf
                            ? "Removing..."
                            : "Remove Admin"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMakeAdmin(user._id)}
                          disabled={makeAdminMutation.isLoading}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                          {makeAdminMutation.isLoading
                            ? "Updating..."
                            : "Make Admin"}
                        </button>
                      )}

                      {/* Delete User */}
                      {user.role !== "admin" && (
                        <button
                          onClick={() => setConfirmDeleteUser(user)}
                          className="px-4 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove User
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-xl ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 text-center shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              Are you sure you want to remove {confirmDeleteUser.name || "this user"}?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleDeleteUser(confirmDeleteUser._id)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;