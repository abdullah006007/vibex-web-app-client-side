import React from 'react';
import { NavLink, Outlet } from 'react-router';
import Logo from '../Pages/Shared/LogoFile/Logo';
import { AiFillHome, AiOutlineExclamationCircle, AiOutlineFileText, AiOutlineNotification, AiOutlinePlusCircle, AiOutlineShoppingCart, AiOutlineUser, AiOutlineUsergroupAdd } from 'react-icons/ai';
import useAuth from '../Hooks/useAuth';
import useRole from '../Hooks/useRole';


const DashboardLayout = () => {

  const { user } = useAuth()
  const { role, roleLoading } = useRole()



  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col ">
        {/* <p>content</p> */}
        {/* Page content here */}
        {/* Navbar */}
        <div className="navbar bg-base-300 w-full lg:hidden">
          <div className="flex-none ">
            <label htmlFor="my-drawer-2" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>
          <div className="mx-2 flex-1 px-2 lg:hidden">Dashboard</div>

        </div>
        {/* Page content here */}
        <Outlet></Outlet>




      </div>
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          {/* Sidebar content here */}
          <Logo></Logo>

          {/* navigation link */}


          <NavLink
            to="/dashboard/home"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'}`
            }
          >
            <AiFillHome className="text-lg" />
            <span>My Profile</span>
          </NavLink>


          <NavLink
            to="/dashboard/add-post"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
              }`
            }
          >
            <AiOutlinePlusCircle className="text-lg" />
            <span>Add Post</span>
          </NavLink>


          <NavLink
            to="/dashboard/my-posts"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
              }`
            }
          >
            <AiOutlineFileText className="text-lg" />
            <span>My Posts</span>
          </NavLink>



          <NavLink
            to="/dashboard/update-profile"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
              }`
            }
          >
            <AiOutlineUser className="text-lg" />
            <span>Update Profile</span>
          </NavLink>







          {/* =========================admin============================= */}


          {
            !roleLoading && role === 'admin' &&

            <>


              <NavLink
                to="/dashboard/admin-profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                  }`
                }
              >
                <AiOutlineUser className="text-lg" />
                <span>Admin Profile</span>
              </NavLink>


              <NavLink
                to="/dashboard/manage-users"
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                  }`
                }
              >
                <AiOutlineUsergroupAdd className="text-lg" />
                <span>Manage Users</span>
              </NavLink>




              <NavLink
                to="/dashboard/reported-activities"
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                  }`
                }
              >
                <AiOutlineExclamationCircle className="text-lg" />
                <span>Reported Comments/Activities</span>
              </NavLink>




              <NavLink
                to="/dashboard/make-announcement"
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                  }`
                }
              >
                <AiOutlineNotification className="text-lg" />
                <span>Make Announcement</span>
              </NavLink>



            </>
          }



        </ul>
      </div>
    </div>
  );
};

export default DashboardLayout;