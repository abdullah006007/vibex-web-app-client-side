import React from 'react';
import useAuth from '../Hooks/useAuth';
import { Navigate, useLocation } from 'react-router';
import Spinner from '../Pages/Shared/Spinner/Spinner';

const PrivateRoute = ({children}) => {
    const {user, loading} = useAuth();
    const location = useLocation(); // Get current location

    if(loading) return <Spinner></Spinner>

    if (!user) {
        // Redirect to login with return URL
        return <Navigate to='/login' state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;