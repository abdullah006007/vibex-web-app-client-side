import React from "react";
import { Link } from "react-router";
import { Home, User, PlusCircle, Users, AlertTriangle, Megaphone, BarChart2 } from "lucide-react";
import useAxiosSecure from "../../Hooks/useAxiosSecure";
import useAuth from "../../Hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const LeftSide = () => {
    const axiosSecure = useAxiosSecure();
    const { user, loading } = useAuth();
    const normalizedEmail = user?.email?.toLowerCase().trim();
    const uid = user?.uid;

    // Fetch user role and badge
    const { data: userInfo = { subscription: "free", Badge: "Bronze", role: "user", bio: "" }, isLoading: userLoading } = useQuery({
        queryKey: ["userRole", normalizedEmail],
        queryFn: async () => {
            if (!normalizedEmail) return { subscription: "free", Badge: "Bronze", role: "user", bio: "" };
            const res = await axiosSecure.get(`/users/role/${normalizedEmail}`);
            return res.data;
        },
        enabled: !!normalizedEmail && !loading,
    });

    // Fetch user post count
    const { data: postCount = { count: 0 }, isLoading: postCountLoading } = useQuery({
        queryKey: ["postCount", uid],
        queryFn: async () => {
            if (!uid) return { count: 0 };
            const res = await axiosSecure.get(`/user/post/count/${uid}`);
            return res.data;
        },
        enabled: !!uid && !loading,
    });

    // Fetch admin profile stats (only for admins)
    const { data: adminStats = {}, isLoading: adminStatsLoading } = useQuery({
        queryKey: ["adminProfile", normalizedEmail],
        queryFn: async () => {
            const res = await axiosSecure.get(`/admin/profile`);
            return res.data;
        },
        enabled: !!normalizedEmail && !loading && userInfo.role === "admin",
    });

    return (
        <div className="w-full max-w-xs bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl shadow-xl border border-purple-100/50 min-h-screen">
            <style>
                {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.8s ease-out;
          }
          .fade-in-delay-1 { animation-delay: 0.2s; }
          .fade-in-delay-2 { animation-delay: 0.4s; }
          .fade-in-delay-3 { animation-delay: 0.6s; }
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          }
        `}
            </style>

            {/* User Profile Section */}
            <div className="fade-in">
                <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100/50 hover-lift mb-6">
                    {userLoading || loading ? (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <img
                                src={user?.photoURL || "https://placehold.co/80x80"}
                                alt="User Profile"
                                className="w-16 h-16 rounded-full mr-3 object-cover"
                            />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">{user?.displayName || "User"}</h2>
                                <p className="text-sm text-gray-600">
                                    {userInfo.subscription === "premium" ? "Premium Member" : "Free Member"} • {userInfo.Badge || "Bronze"} Badge
                                </p>
                                {/* <p className="text-xs text-gray-500 italic mt-1">
                  {userInfo.role === "admin" ? "Community Admin" : "Passionate Developer"}
                </p> */}
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {userInfo.bio ? userInfo.bio : "No bio set. Update your profile to add one!"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div className="fade-in fade-in-delay-1">
                <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100/50 hover-lift mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Stats</h3>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-gray-600">Posts</p>
                            <p className="text-lg font-medium text-gray-900">
                                {postCountLoading ? "..." : (postCount?.count ?? 0)}
                            </p>
                        </div>
                        {userInfo.role === "admin" && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-600">Total Users</p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {adminStatsLoading ? "..." : (adminStats.users ?? 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Posts</p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {adminStatsLoading ? "..." : (adminStats.totalPosts ?? 0)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Membership Prompt (Non-Premium Users) */}
            {userInfo.subscription !== "premium" && (
                <div className="fade-in fade-in-delay-2">
                    <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100/50 hover-lift mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Unlock Premium Features</h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Get unlimited posts and a Gold Badge with Premium Membership!
                        </p>
                        <Link
                            to="/membership"
                            className="block w-full text-center py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 hover-lift"
                        >
                            Upgrade Now
                        </Link>
                    </div>
                </div>
            )}

            {/* Navigation Menu */}
            <div className="fade-in fade-in-delay-2">
                <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100/50 hover-lift mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Explore</h3>
                    <ul className="space-y-3">



                        {
                            userInfo.role === 'user' && <>
                                <li>
                                    <Link
                                        to="/dashboard/home"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <Home className="w-5 h-5 mr-2 text-indigo-600" />
                                        Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/dashboard/my-posts"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <User className="w-5 h-5 mr-2 text-indigo-600" />
                                        My Posts
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/dashboard/add-post"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                        Add Post
                                    </Link>
                                </li>




                            </>
                        }


                        <li>
                            <Link
                                to="/dashboard/update-profile"
                                className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                            >
                                <User className="w-5 h-5 mr-2 text-indigo-600" />
                                Update Profile
                            </Link>

                        </li>




                        {userInfo.role === "admin" && (
                            <>
                                <li>
                                    <Link
                                        to="/dashboard/admin-profile"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <BarChart2 className="w-5 h-5 mr-2 text-indigo-600" />
                                        Admin Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/dashboard/manage-users"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                        Manage Users
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/dashboard/reported-activities"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <AlertTriangle className="w-5 h-5 mr-2 text-indigo-600" />
                                        Reported Activities
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/dashboard/make-announcement"
                                        className="flex items-center text-sm text-gray-900 hover:text-indigo-600 hover-lift"
                                    >
                                        <Megaphone className="w-5 h-5 mr-2 text-indigo-600" />
                                        Make Announcement
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-6 text-center fade-in fade-in-delay-3">
                <div className="text-sm text-gray-600">
                    <Link to="/about" className="hover:underline text-indigo-600 mr-2">
                        About
                    </Link>
                    <Link to="/register" className="hover:underline text-indigo-600 mr-2">
                        Register
                    </Link>
                    <Link to="/join-us" className="hover:underline text-indigo-600">
                        Log In
                    </Link>
                </div>
                <p className="text-xs text-gray-500 mt-2">© 2025 Developer Community</p>
            </div>
        </div>
    );
};

export default LeftSide;