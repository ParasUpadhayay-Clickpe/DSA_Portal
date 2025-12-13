import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { ChevronDownIcon, LogOutIcon, SettingsIcon, MenuIcon } from '@/components/icons';
import styles from './Header.module.css';

interface HeaderProps {
    sidebarCollapsed: boolean;
    onMobileMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onMobileMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const { selectedRole, availableRoles, setSelectedRole } = useRole();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/agent-login');
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setShowUserMenu(false);
    };

    const getUserInitials = () => {
        if (currentUser?.username) {
            return currentUser.username.substring(0, 2).toUpperCase();
        }
        return 'AG';
    };

    const getUserDisplayName = () => {
        if (currentUser?.username) {
            return currentUser.username;
        }
        return 'Agent';
    };

    return (
        <header
            className={`${styles.header} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}
        >
            <div className={styles.headerContent}>
                <div className={styles.leftSection}>
                    {onMobileMenuClick && (
                        <button
                            className={styles.mobileMenuButton}
                            onClick={onMobileMenuClick}
                            aria-label="Toggle menu"
                        >
                            <MenuIcon size={20} />
                        </button>
                    )}
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                </div>

                <div className={styles.rightSection}>
                    {/* Role Switcher */}
                    {availableRoles.length > 0 && (
                        <div className={styles.roleMenuContainer}>
                            <button
                                className={styles.roleButton}
                                onClick={() => setShowRoleMenu(!showRoleMenu)}
                                aria-label="Switch role"
                            >
                                <span className={styles.roleLabel}>
                                    {selectedRole ? selectedRole.role_type.replace('_', ' ') : 'Agent'}
                                </span>
                                <ChevronDownIcon size={14} className={styles.dropdownIcon} />
                            </button>

                            {showRoleMenu && (
                                <>
                                    <div
                                        className={styles.overlay}
                                        onClick={() => setShowRoleMenu(false)}
                                    />
                                    <div className={styles.roleDropdown}>
                                        <div className={styles.roleDropdownHeader}>Switch Role</div>
                                        <div className={styles.dropdownDivider} />
                                        <button
                                            className={`${styles.roleDropdownItem} ${!selectedRole ? styles.activeRole : ''}`}
                                            onClick={() => {
                                                setSelectedRole(null);
                                                setShowRoleMenu(false);
                                            }}
                                        >
                                            <span>Agent</span>
                                            {!selectedRole && <span className={styles.checkmark}>✓</span>}
                                        </button>
                                        {availableRoles.map((role) => (
                                            <button
                                                key={role.role_id}
                                                className={`${styles.roleDropdownItem} ${selectedRole?.role_id === role.role_id ? styles.activeRole : ''}`}
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setShowRoleMenu(false);
                                                }}
                                            >
                                                <span>{role.role_type.replace('_', ' ')}</span>
                                                {selectedRole?.role_id === role.role_id && (
                                                    <span className={styles.checkmark}>✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* User Menu */}
                    <div className={styles.userMenuContainer}>
                        <button
                            className={styles.userButton}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            aria-label="User menu"
                        >
                            <div className={styles.avatar}>
                                {getUserInitials()}
                            </div>
                            {!sidebarCollapsed && (
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{getUserDisplayName()}</span>
                                    <span className={styles.userRole}>
                                        {selectedRole ? selectedRole.role_type.replace('_', ' ') : 'Agent'}
                                    </span>
                                </div>
                            )}
                            <ChevronDownIcon size={14} className={styles.dropdownIcon} />
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className={styles.overlay}
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className={styles.userDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.dropdownAvatar}>
                                            {getUserInitials()}
                                        </div>
                                        <div className={styles.dropdownUserInfo}>
                                            <span className={styles.dropdownUserName}>
                                                {getUserDisplayName()}
                                            </span>
                                            {currentUser?.email && (
                                                <span className={styles.dropdownUserEmail}>
                                                    {currentUser.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <button
                                        className={styles.dropdownItem}
                                        onClick={handleProfileClick}
                                    >
                                        <span className={styles.dropdownItemIcon}>
                                            <SettingsIcon size={16} />
                                        </span>
                                        <span>Profile Settings</span>
                                    </button>
                                    <button
                                        className={styles.dropdownItem}
                                        onClick={handleLogout}
                                    >
                                        <span className={styles.dropdownItemIcon}>
                                            <LogOutIcon size={16} />
                                        </span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

