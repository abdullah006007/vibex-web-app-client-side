import React from 'react';
import { Outlet } from 'react-router';
import Logo from '../Pages/Shared/LogoFile/Logo';
import Lottie from 'lottie-react';

import loginAnimation from '../assets/Login.json';

const AuthLayout = () => {
    return (
        <div className='max-w-7xl mx-auto'>
            <Logo />
            <div className="hero-content flex-col lg:flex-row-reverse">
                
                {/* JSON animation with lottie-react */}
                <div className="flex justify-center items-center">
                    <Lottie
                        animationData={loginAnimation}
                        loop={true}
                        style={{ height: "400px", width: "400px" }}
                    />
                </div>

                {/* Login/Register forms */}
                <div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
