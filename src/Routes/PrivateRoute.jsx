import React from 'react';
import useAuth from '../Hooks/useAuth';

import { Navigate } from 'react-router';
import Spinner from '../Pages/Shared/Spinner/Spinner';

const PrivateRoute = ({children}) => {

    const {user, loading} = useAuth()

    if(loading) return <Spinner></Spinner>

    if (!user) {
        <Navigate to='/login'></Navigate>
        
    }

  

    return children
};

export default PrivateRoute;