import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import useAxiosSecure from "../../Hooks/useAxiosSecure";
import useAuth from "../../Hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import FindConnection from "./FindConnection";

const RightComponent = () => {
  const axiosSecure = useAxiosSecure();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Normalize email to match backend
  const normalizedEmail = user?.email?.toLowerCase().trim();
  console.log(`RightComponent: User email=${normalizedEmail}, loading=${loading}`);

  // Fetch user-specific notifications
  const { data: notifications = [], isLoading, isError, error } = useQuery({
    queryKey: ["notifications", normalizedEmail],
    queryFn: async () => {
      if (!normalizedEmail) {
        console.warn("No email provided for notifications fetch");
        return [];
      }
      console.log(`Fetching notifications for ${normalizedEmail}`);
      const res = await axiosSecure.get(`/notifications/${normalizedEmail}`);
      console.log(`Fetched ${res.data.length} notifications`);
      return res.data;
    },
    enabled: !!normalizedEmail && !loading,
    refetchOnWindowFocus: true,
  });

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      console.log(`Marking notification ${notificationId} as read`);
      return await axiosSecure.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      console.log("Notification marked as read successfully");
      queryClient.invalidateQueries(["notifications", normalizedEmail]);
      setSelectedAnnouncement(null); // Close modal
      toast.success("Notification marked as read", { position: "top-right" });
    },
    onError: (err) => {
      console.error("Error marking notification as read:", err);
      toast.error(err.response?.data?.message || "Failed to mark notification as read", {
        position: "top-right",
      });
    },
  });

  // Slice notifications to show only 6 initially
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 6);

  return (
    <div className="md:w-80 bg-gray-50 p-4 rounded-lg hidden md:block shadow space-y-6">
      <FindConnection></FindConnection>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h2>

        {isLoading || loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">{error.message || "Failed to load announcements"}</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements yet.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {displayedNotifications.map((ann) => (
                <li
                  key={ann._id}
                  className="bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                >
                  <p className="text-sm text-gray-700 truncate">{ann.description}</p>
                  <button
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="mt-2 text-blue-500 text-xs font-medium hover:underline"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
            {notifications.length > 6 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-4 text-blue-500 text-sm font-medium hover:underline"
              >
                View All ({notifications.length})
              </button>
            )}
          </>
        )}
      </div>

      {/* Modal for full announcement */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto relative shadow-lg">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedAnnouncement.authorName && (
              <p className="text-xs text-gray-500 mb-2">By {selectedAnnouncement.authorName}</p>
            )}

            <div className="flex justify-center items-center">
              <h3 className="text-sm text-gray-600 mb-1">Title:</h3>
              <h3 className="text-md text-blue-600 mb-1 ml-2">{selectedAnnouncement.title}</h3>
            </div>

            {selectedAnnouncement.authorImage && (
              <img
                src={selectedAnnouncement.authorImage}
                alt={selectedAnnouncement.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}

            <p className="text-sm text-gray-700">{selectedAnnouncement.description}</p>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => markAsReadMutation.mutate(selectedAnnouncement._id)}
                className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                disabled={markAsReadMutation.isPending}
              >
                {markAsReadMutation.isPending ? "Marking..." : "Mark as Read"}
              </button>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="btn bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg"
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

export default RightComponent;