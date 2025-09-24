import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';

const useRole = () => {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    const {
        data: userData = { role: 'user' },
        isLoading: roleLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['userRole', user?.email],
        enabled: !authLoading && !!user?.email,
        queryFn: async () => {
            try {
                const res = await axiosSecure.get(`/users/role/${user.email}`);
                return res.data;
            } catch (err) {
                console.error('Error fetching user role:', err); // <- This logs AxiosError
                return { role: 'user', email: user.email };
            }
        },
    });

    return {
        role: userData?.role || 'user',
        roleLoading: authLoading || roleLoading,
        error,
        refetch
    };
};

export default useRole; 