import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { Profile as ProfileComponent } from '@/components/profile';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <ProfileComponent />
        </MainLayout>
    );
};

