import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from '@/components/layout';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setIsMobileOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleMobileMenuClick = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    const handleMobileClose = () => {
        setIsMobileOpen(false);
    };

    return (
        <div className={styles.layoutContainer}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={handleToggleSidebar}
                isMobileOpen={isMobileOpen}
                onMobileClose={handleMobileClose}
            />
            <Header
                sidebarCollapsed={sidebarCollapsed}
                onMobileMenuClick={isMobile ? handleMobileMenuClick : undefined}
            />
            <main
                className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}
            >
                {children}
            </main>
        </div>
    );
};

