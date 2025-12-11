import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common';
import styles from './Home.module.css';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, currentUser, logout } = useAuth();

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Welcome to DSA Portal</h1>
                {currentUser && (
                    <div className={styles.userInfo}>
                        <p className={styles.userText}>
                            Logged in as: <strong>{currentUser.username}</strong>
                        </p>
                        {currentUser.email && (
                            <p className={styles.userText}>Email: {currentUser.email}</p>
                        )}
                        {currentUser.mobile && (
                            <p className={styles.userText}>Mobile: {currentUser.mobile}</p>
                        )}
                    </div>
                )}
                <Button variant="primary" onClick={logout}>
                    Logout
                </Button>
            </div>
        </div>
    );
};

