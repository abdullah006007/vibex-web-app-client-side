import { createBrowserRouter } from "react-router";
import RootLayout from "../Layout/RootLayout";
import Home from "../Pages/Homepage/Home/Home";
import AuthLayout from "../Layout/AuthLayout";
import LogIn from "../Component/Authentication/LogIn";
import Register from "../Component/Authentication/Register";
import PrivateRoute from "../Routes/PrivateRoute";
import Dashboard from "../Layout/DashboardLayout";
import DashHome from "../Pages/Dashboard/DashHome";
import MyOrder from "../Pages/Dashboard/AddPost";
import UpdateProfile from "../Pages/UpdareProfile/UpdateProfile";
import AddPost from "../Pages/Dashboard/AddPost";
import MyPost from "../Pages/Dashboard/MyPost";
import AdminProfile from "../Pages/Dashboard/Admin/AdminProfile";
import ManageUser from "../Pages/Dashboard/Admin/ManageUser";
import ReportActivity from "../Pages/Dashboard/Admin/ReportActivity";
import AnounceMent from "../Pages/Dashboard/Admin/Announcement";
import AdminRoute from "../Routes/AdminRoute";
import Announcement from "../Pages/Dashboard/Admin/Announcement";
import PostComments from "../Pages/Dashboard/PostComments";
import PostDetails from "../Pages/Dashboard/PostDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
        {
            index: true,
            Component : Home
        }
    ]
  },
  {
    path: '/',
    Component: AuthLayout,
    children: [
        {
            path: 'login',
            Component: LogIn
        },
        {
            path : 'register',
            Component: Register
        }
    ]
  },
  {
    path: 'dashboard',
    element: <PrivateRoute>
      <Dashboard></Dashboard>
    </PrivateRoute>,
    children: [
      {
        path:'home',
        Component: DashHome
      }
      ,
      
      {
        path: 'update-profile',
        Component: UpdateProfile
      }
      ,{
        path: 'add-post',
        Component: AddPost
      }
      ,{
        path: 'my-posts',
        Component: MyPost
      }
      ,



      //admin route

      {
        path: 'admin-profile',
        element: 
        
        <AdminRoute>
          <AdminProfile></AdminProfile>
        </AdminRoute>
        
      },
      {
        path: 'manage-users',
        element: 
        
       <AdminRoute>
         <ManageUser></ManageUser>
       </AdminRoute>
        
      },
      {
        path: 'reported-activities',
        element: 
        
       <AdminRoute>
        <ReportActivity></ReportActivity>
       </AdminRoute>
        
      },
      {
        path: 'make-announcement',
        element: 
        
       <AdminRoute>
       <Announcement></Announcement>
       </AdminRoute>
        
      },
      {
        path: 'post/:postId/comments',
        element: 
       <PostComments></PostComments>        
      },
      {
        path: 'post/:postId',
        element: 
       <PostDetails></PostDetails>     
      }


    ]
  }
]);