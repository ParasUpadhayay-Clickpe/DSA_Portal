import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import styles from './Home.module.css';

export const Home: React.FC = () => {
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
            <div className={styles.dashboardContainer}>
                <div className={styles.dashboardCard}>
                    <h1 className={styles.welcomeTitle}>Welcome to DSA Portal</h1>
                    <p className={styles.welcomeSubtitle}>
                        Your dashboard is ready. Start managing your leads and loans.
                    </p>
                    {/* Dashboard content will be added here */}
                </div>
            </div>
        </MainLayout>
    );
};

