import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useAxiosSecure from "../../../Hooks/useAxiosSecure";
import useAuth from "../../../Hooks/useAuth";
import Modal from "react-modal";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { FaUpload, FaTrash, FaCropAlt } from "react-icons/fa";

Modal.setAppElement("#root");

const Announcement = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [authorImage, setAuthorImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Fetch user role
  const { data: userRoleData, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ["userRole", user?.email],
    queryFn: async () => {
      if (!user?.email) return { role: "user" };
      const response = await axiosSecure.get(`/users/role/${user.email}`);
      return response.data;
    },
    enabled: !!user?.email && !authLoading,
  });

  // Fetch all announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await axiosSecure.get("/announcements");
      return response.data;
    },
  });

  // Mutation for creating announcement
  const announcementMutation = useMutation({
    mutationFn: async (data) => {
      if (!croppedBlob) throw new Error("Please crop an image first");
      const formData = new FormData();
      formData.append("authorName", data.authorName.trim());
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("authorImage", croppedBlob, "announcement_image.jpg");
      const response = await axiosSecure.post("/announcements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Announcement posted successfully! Notified ${data.notifications?.success || 0} users.`, {
        position: "top-right",
        duration: 5000,
      });
      queryClient.invalidateQueries(["announcements"]);
      queryClient.invalidateQueries(["notifications"]);
      setAuthorImage(null);
      setPreviewImage("");
      setCroppedBlob(null);
      reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      console.error("Announcement creation error:", err);
      toast.error(err.response?.data?.message || "Failed to post announcement", {
        position: "top-right",
        duration: 5000,
      });
    },
  });

  // Mutation for deleting announcement
  const deleteMutation = useMutation({
    mutationFn: async (announcementId) => {
      return await axiosSecure.delete(`/announcements/${announcementId}`);
    },
    onSuccess: () => {
      toast.success("Announcement deleted successfully!", {
        position: "top-right",
        duration: 5000,
      });
      queryClient.invalidateQueries(["announcements"]);
      queryClient.invalidateQueries(["notifications"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete announcement", {
        position: "top-right",
        duration: 5000,
      });
    },
  });

  // Handle file selection for cropping
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB", { position: "top-right" });
      return;
    }
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validImageTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or GIF)", {
        position: "top-right",
      });
      return;
    }
    try {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
      setAuthorImage(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      setCropModalOpen(true);
      setCroppedBlob(null);
    } catch (error) {
      console.error("Error creating object URL:", error);
      toast.error("Failed to process the image", { position: "top-right" });
    }
  };

  // Handle crop
  const handleCropAndUpload = () => {
    if (!cropperRef.current?.cropper) {
      toast.error("Cropper not initialized", { position: "top-right" });
      return;
    }
    try {
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
        width: 200,
        height: 200,
      });
      if (!croppedCanvas) {
        toast.error("Failed to crop image", { position: "top-right" });
        return;
      }
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Failed to create image blob", { position: "top-right" });
            return;
          }
          if (blob.size > 5 * 1024 * 1024) {
            toast.error("Cropped image is too large", { position: "top-right" });
            return;
          }
          if (previewImage && previewImage.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage);
          }
          setCroppedBlob(blob);
          setPreviewImage(URL.createObjectURL(blob));
          setCropModalOpen(false);
          toast.success("Image cropped successfully! You can now submit the announcement.", {
            position: "top-right",
            duration: 5000,
          });
        },
        "image/jpeg",
        0.8
      );
    } catch (error) {
      console.error("Error during cropping:", error);
      toast.error("Error during image cropping", { position: "top-right" });
    }
  };

  // Handle delete image
  const handleDeleteImage = () => {
    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    setAuthorImage(null);
    setPreviewImage("");
    setCroppedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Image removed successfully!", { position: "top-right" });
  };

  // Handle form submission
  const onSubmit = (data) => {
    if (!croppedBlob) {
      toast.error("Please select and crop an author image", { position: "top-right" });
      return;
    }
    announcementMutation.mutate(data);
  };

  // Handle delete announcement
  const handleDelete = (announcementId) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate(announcementId);
    }
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (roleError) {
    toast.error("Failed to fetch user role. Please try again.", {
      position: "top-right",
    });
    return <div className="text-center text-red-500">Error loading user role</div>;
  }

  const isAdmin = userRoleData?.role === "admin";

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-center flex-1">Announcements</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          aria-label="View all announcements"
        >
          View All Announcements
        </button>
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-8">
          <div>
            <label className="block mb-1 font-semibold">Author Image *</label>
            <div className="relative mb-4">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-md flex items-center justify-center bg-gray-100">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Author Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      toast.error("Failed to load image", { position: "top-right" });
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-4xl">No Image</div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 flex gap-2">
                <label
                  className={`bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md ${
                    announcementMutation.isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={announcementMutation.isLoading}
                    aria-label="Upload author image"
                  />
                  <FaUpload className="h-5 w-5" />
                </label>
                {previewImage && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className={`bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-md ${
                      announcementMutation.isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={announcementMutation.isLoading}
                    aria-label="Delete author image"
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Upload a JPEG, PNG, or GIF image (max 5MB)
            </p>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Author Name *</label>
            <input
              type="text"
              {...register("authorName", {
                required: "Author name is required",
                maxLength: { value: 50, message: "Author name must be 50 characters or less" },
              })}
              className="w-full border rounded-xl p-2 focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter your name"
              disabled={announcementMutation.isLoading}
            />
            {errors.authorName && (
              <p className="text-red-500 text-sm mt-1">{errors.authorName.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-semibold">Title *</label>
            <input
              type="text"
              {...register("title", {
                required: "Title is required",
                maxLength: { value: 100, message: "Title must be 100 characters or less" },
              })}
              className="w-full border rounded-xl p-2 focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter announcement title"
              disabled={announcementMutation.isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-semibold">Description *</label>
            <textarea
              {...register("description", {
                required: "Description is required",
                maxLength: { value: 1000, message: "Description must be 1000 characters or less" },
              })}
              className="w-full border rounded-xl p-2 h-32 focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter announcement description"
              disabled={announcementMutation.isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
          <button
            type="submit"
            className={`bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold mt-4 ${
              announcementMutation.isLoading || !croppedBlob
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={announcementMutation.isLoading || !croppedBlob}
            aria-label="Submit announcement"
          >
            {announcementMutation.isLoading ? "Posting..." : "Submit Announcement"}
          </button>
        </form>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="View Announcements"
        className="max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-xl p-6"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
        aria={{ labelledby: "announcements-modal-title" }}
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 id="announcements-modal-title" className="text-2xl font-bold mb-4">
            All Announcements
          </h2>
          {announcementsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : announcements.length === 0 ? (
            <p>No announcements found.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border p-4 rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">{announcement.title}</h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className={`bg-red-600 text-white px-3 py-1 rounded-xl hover:bg-red-700 transition-colors ${
                          deleteMutation.isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={deleteMutation.isLoading}
                        aria-label={`Delete announcement: ${announcement.title}`}
                      >
                        {deleteMutation.isLoading ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2 whitespace-pre-wrap">{announcement.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Posted by: {announcement.authorName}</p>
                    <p>Posted on: {new Date(announcement.createdAt).toLocaleDateString()}</p>
                  </div>
                  {announcement.authorImage && (
                    <img
                      src={announcement.authorImage}
                      alt={`Author image for ${announcement.authorName}`}
                      className="w-16 h-16 rounded-full mt-2 object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        toast.error("Failed to load author image", { position: "top-right" });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(false)}
            className="mt-6 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors w-full"
            aria-label="Close announcements modal"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={cropModalOpen}
        onRequestClose={() => {
          setCropModalOpen(false);
          if (previewImage.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage);
          }
          setPreviewImage("");
          setAuthorImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        contentLabel="Crop Image"
        className="max-w-2xl mx-auto mt-10 bg-white rounded-lg shadow-xl p-6"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
        aria={{ labelledby: "crop-modal-title" }}
      >
        <h2 id="crop-modal-title" className="text-2xl font-bold text-gray-800 mb-4">
          Crop Your Image
        </h2>
        <p className="text-gray-600 mb-4">Adjust the cropping area (1:1 aspect ratio)</p>
        {previewImage && (
          <div className="mb-4">
            <Cropper
              src={previewImage}
              style={{ height: 400, width: "100%" }}
              initialAspectRatio={1}
              aspectRatio={1}
              guides={true}
              ref={cropperRef}
              viewMode={1}
              minCropBoxHeight={100}
              minCropBoxWidth={100}
              background={false}
              responsive={true}
              autoCropArea={0.8}
              checkOrientation={false}
            />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={() => {
              setCropModalOpen(false);
              if (previewImage.startsWith("blob:")) {
                URL.revokeObjectURL(previewImage);
              }
              setPreviewImage("");
              setAuthorImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            aria-label="Cancel image cropping"
          >
            Cancel
          </button>
          <button
            onClick={handleCropAndUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            aria-label="Crop image"
          >
            <FaCropAlt className="mr-2" />
            Crop
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Announcement;