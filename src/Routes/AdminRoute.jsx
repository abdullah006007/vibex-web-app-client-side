import { Navigate } from 'react-router';
import useAuth from '../Hooks/useAuth';
import useRole from '../Hooks/useRole';
import Spinner from '../Pages/Shared/Spinner/Spinner';

const AdminRoute = ({children}) => {


    const {user, loading} = useAuth()
    const {role, roleLoading} = useRole()


    if(loading || roleLoading){
        return <Spinner></Spinner>
    }

    if(!user || role !== 'admin'){
        return <Navigate state={{ from :location.pathname}} to="/forbidden"></Navigate>
    }


    return children;
};

export default AdminRoute;