import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ClickPeLogo from '@/assets/images/ClickPe_Logo.png';
import {
    DashboardIcon,
    UsersIcon,
    FileTextIcon,
    NetworkIcon,
    UserIcon,
    LogOutIcon,
    UserPlusIcon,
} from '@/components/icons';
import { getExternalURL } from '@/config';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    path: string;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Leads', icon: <UsersIcon />, path: '/leads' },
    { label: 'Loans', icon: <FileTextIcon />, path: '/loans' },
    { label: 'Sub Agents', icon: <NetworkIcon />, path: '/sub-agents' },
    { label: 'Profile', icon: <UserIcon />, path: '/profile' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const handleNavigation = (path: string) => {
        navigate(path);
        if (onMobileClose) {
            onMobileClose();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/agent-login');
        if (onMobileClose) {
            onMobileClose();
        }
    };

    const handleAddSubAgent = () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId') || '';
        if (agentId) {
            const baseUrl = getExternalURL('AGENT_ONBOARDING');
            window.open(`${baseUrl}/?referredby=${agentId}`, '_blank');
        } else {
            alert('Agent ID not found');
        }
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <>
            {isMobileOpen && (
                <div className={styles.mobileOverlay} onClick={onMobileClose} />
            )}
            <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.logoContainer}
                        onClick={onToggle}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <img
                            src={ClickPeLogo}
                            alt="ClickPe Logo"
                            className={styles.logo}
                        />
                        {!isCollapsed && (
                            <span className={styles.logoText}>ClickPe</span>
                        )}
                    </button>
                </div>

                <nav className={styles.nav}>
                    <ul className={styles.menuList}>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <button
                                        className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                                        onClick={() => handleNavigation(item.path)}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <span className={styles.menuIcon}>{item.icon}</span>
                                        {!isCollapsed && (
                                            <span className={styles.menuLabel}>{item.label}</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                        <li>
                            <button
                                className={styles.menuItem}
                                onClick={handleAddSubAgent}
                                title={isCollapsed ? 'Add New Sub-Agent' : undefined}
                            >
                                <span className={styles.menuIcon}>
                                    <UserPlusIcon />
                                </span>
                                {!isCollapsed && (
                                    <span className={styles.menuLabel}>Add New Sub-Agent</span>
                                )}
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button
                        className={styles.logoutButton}
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <span className={styles.menuIcon}>
                            <LogOutIcon />
                        </span>
                        {!isCollapsed && (
                            <span className={styles.menuLabel}>Logout</span>
                        )}
                    </button>
                    {!isCollapsed && (
                        <p className={styles.footerText}>
                            © 2024 ClickPe
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
};

