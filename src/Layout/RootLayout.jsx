import React from 'react';
import { Outlet } from 'react-router';
import Navbar from '../Pages/Shared/Navbar/Navbar';
import { Toaster } from 'react-hot-toast';

const RootLayout = () => {


    return (
        <div>
             <Toaster />
            
            <Navbar></Navbar>
            <div className='min-h-[calc(100vh-117px)] max-w-7xl mx-auto'>
                <div className='px-5 '>
                    <Outlet></Outlet>
                </div>
            </div>


        </div>
    );
};
export default RootLayout;