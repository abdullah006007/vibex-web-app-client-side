// router.jsx
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Layout/RootLayout";
import Home from "../Pages/Homepage/Home/Home";
import AuthLayout from "../Layout/AuthLayout";
import LogIn from "../Component/Authentication/LogIn";
import Register from "../Component/Authentication/Register";
import PrivateRoute from "../Routes/PrivateRoute";
import AdminRoute from "../Routes/AdminRoute";
import Dashboard from "../Layout/DashboardLayout";
import DashHome from "../Pages/Dashboard/DashHome";
import UpdateProfile from "../Pages/UpdareProfile/UpdateProfile";
import AddPost from "../Pages/Dashboard/AddPost";
import MyPost from "../Pages/Dashboard/MyPost";
import AdminProfile from "../Pages/Dashboard/Admin/AdminProfile";
import ManageUser from "../Pages/Dashboard/Admin/ManageUser";
import ReportActivity from "../Pages/Dashboard/Admin/ReportActivity";
import Announcement from "../Pages/Dashboard/Admin/Announcement";
import PostComments from "../Pages/Dashboard/PostComments";
import PostDetails from "../Pages/Dashboard/PostDetails";
import Membership from "../Pages/Merbership/Membership";
import JoinUs from "../Pages/JoinUs/JoinUs";
import About from "../Pages/About/About";
import ErrorElement from "../Pages/UpdareProfile/ErrorElement";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorElement />, 
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "join-us",
        element: <JoinUs />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "membership",
        element: (
          <PrivateRoute>
            <Membership />
          </PrivateRoute>
        ),
        errorElement: <ErrorElement />, 
      },
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <ErrorElement />, 
    children: [
      {
        path: "login",
        element: <LogIn />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
  {
    path: "dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
    errorElement: <ErrorElement />, // Catch errors in Dashboard and child routes
    children: [
      {
        path: "home",
        element: (
          <PrivateRoute>
            <DashHome />
          </PrivateRoute>
        ),
      },
      {
        path: "update-profile",
        element: <PrivateRoute>
          <UpdateProfile />
        </PrivateRoute>
        ,
      },
      {
        path: "add-post",
        element: <PrivateRoute>
          <AddPost />
        </PrivateRoute>,
      },
      {
        path: "my-posts",
        element: <PrivateRoute>
          <MyPost />
        </PrivateRoute>,
      },


      // Admin Routes
      {
        path: "admin-profile",
        element: (
          <AdminRoute>
            <AdminProfile />
          </AdminRoute>
        ),
        errorElement: <ErrorElement />, 
      },
      {
        path: "manage-users",
        element: (
          <AdminRoute>
            <ManageUser />
          </AdminRoute>
        ),
        errorElement: <ErrorElement />,
      },
      {
        path: "reported-activities",
        element: (
          <PrivateRoute>
            <AdminRoute>
              <ReportActivity />
            </AdminRoute>
          </PrivateRoute>
        ),
        errorElement: <ErrorElement />,
      },
      {
        path: "make-announcement",
        element: (
          <PrivateRoute>
            <AdminRoute>
              <Announcement />
            </AdminRoute>
          </PrivateRoute>
        ),
        errorElement: <ErrorElement />,
      },
      {
        path: "post/:postId/comments",
        element: <PostComments />,
        errorElement: <ErrorElement />, // Handle 401 errors in PostComments
      },
      {
        path: "post/:postId",
        element: <PostDetails />,
        errorElement: <ErrorElement />,
      },
    ],
  },
  {
    path: "/forbidden",
    element: <ErrorElement error={{ code: "403", message: "Unauthorized access" }} />,
  },
  {
    path: "*",
    element: <ErrorElement error={{ code: "404", message: "Page not found" }} />,
  },
]);