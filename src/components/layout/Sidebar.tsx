import React from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ClickPeLogo from "@/assets/images/ClickPe_Logo.png";
import {
  DashboardIcon,
  UsersIcon,
  FileTextIcon,
  NetworkIcon,
  UserIcon,
  LogOutIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
} from "@/components/icons";
import { getExternalURL } from "@/config";
import styles from "./Sidebar.module.css";

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
  { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "Leads", icon: <UsersIcon />, path: "/leads" },
  { label: "Loans", icon: <FileTextIcon />, path: "/loans" },
  { label: "Sub Agents", icon: <NetworkIcon />, path: "/sub-agents" },
  { label: "Products", icon: <PackageIcon />, path: "/products" },
  { label: "Profile", icon: <UserIcon />, path: "/profile" },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();

  const currentAgentId = searchParams.get("agentId");
  const currentAgentName = searchParams.get("agentName");

  const handleNavigation = (path: string) => {
    const agentContextPaths = [
      "/",
      "/leads",
      "/loans",
      "/sub-agents",
      "/profile",
    ];

    if (currentAgentId && agentContextPaths.includes(path)) {
      const newParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key.startsWith("agent") || key === "agentId") {
          newParams.set(key, value);
        }
      });
      navigate(`${path}?${newParams.toString()}`);
    } else {
      navigate(path);
    }

    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/agent-login");
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleAddSubAgent = () => {
    const agentId =
      localStorage.getItem("agent_id") || localStorage.getItem("agentId") || "";
    if (agentId) {
      const baseUrl = getExternalURL("AGENT_ONBOARDING");
      window.open(`${baseUrl}/?referredby=${agentId}`, "_blank");
    } else {
      alert("Agent ID not found");
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const isRouteActive = (itemPath: string) => {
    if (itemPath === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={onMobileClose} />
      )}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${
          isMobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <button
            className={styles.logoContainer}
            onClick={onToggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <img src={ClickPeLogo} alt="ClickPe Logo" className={styles.logo} />
            {!isCollapsed && <span className={styles.logoText}>ClickPe</span>}
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => {
              const isActive = isRouteActive(item.path);
              return (
                <li key={item.path}>
                  <button
                    className={`${styles.menuItem} ${
                      isActive ? styles.active : ""
                    }`}
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
                title={isCollapsed ? "Add New Sub-Agent" : undefined}
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

        {!isCollapsed && currentAgentName && (
          <div
            style={{
              padding: "12px",
              margin: "0 12px 12px 12px",
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
                color: "#3b82f6",
                fontSize: "0.75rem",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Viewing as:</span>
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#1e3a8a",
                marginBottom: "8px",
                paddingLeft: "22px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentAgentName}
            </div>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 0 0 22px",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span style={{ textDecoration: "underline" }}>
                Exit Agent View
              </span>
            </button>
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <button
            className={styles.toggleButton}
            onClick={onToggle}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={styles.menuIcon}>
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </span>
            {!isCollapsed && <span className={styles.menuLabel}>Collapse</span>}
          </button>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className={styles.menuIcon}>
              <LogOutIcon />
            </span>
            {!isCollapsed && <span className={styles.menuLabel}>Logout</span>}
          </button>
          {!isCollapsed && <p className={styles.footerText}>© 2024 ClickPe</p>}
        </div>
      </aside>
    </>
  );
};
