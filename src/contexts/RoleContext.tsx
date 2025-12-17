import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { entityRoleMappingApi } from '@/api';
import type { AgentRole } from '@/types/entityRoleMapping.types';

interface RoleContextType {
    selectedRole: AgentRole | null;
    availableRoles: AgentRole[];
    loading: boolean;
    setSelectedRole: (role: AgentRole | null) => void;
    refreshRoles: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within RoleProvider');
    }
    return context;
};

interface RoleProviderProps {
    children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
    const [selectedRole, setSelectedRoleState] = useState<AgentRole | null>(null);
    const [availableRoles, setAvailableRoles] = useState<AgentRole[]>([]);
    const [loading, setLoading] = useState(true);
    const rolesLoadedRef = useRef(false);

    const loadRoles = async () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
        if (!agentId) {
            setLoading(false);
            rolesLoadedRef.current = false;
            return;
        }

        setLoading(true);
        try {
            const response = await entityRoleMappingApi.getAgentRoles({ agent_id: agentId });
            if (response.status === 'Success' && response.response) {
                setAvailableRoles(response.response.roles || []);
                rolesLoadedRef.current = true;

                // Load saved role from localStorage
                const savedRoleId = localStorage.getItem('selected_role_id');
                if (savedRoleId) {
                    const savedRole = response.response.roles.find(r => r.role_id === savedRoleId);
                    if (savedRole) {
                        setSelectedRoleState(savedRole);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
            rolesLoadedRef.current = false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load roles on mount
        loadRoles();

        // Listen for custom event dispatched after login
        const handleAgentLogin = () => {
            rolesLoadedRef.current = false; // Reset flag so roles can be reloaded
            loadRoles();
        };

        window.addEventListener('agentLoggedIn', handleAgentLogin);

        // Also check periodically if agent_id exists but roles haven't been loaded
        // This handles the case where agent_id is set but event wasn't dispatched
        const checkInterval = setInterval(() => {
            const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
            if (agentId && !rolesLoadedRef.current && !loading) {
                loadRoles();
            }
        }, 500); // Check every 500ms

        return () => {
            window.removeEventListener('agentLoggedIn', handleAgentLogin);
            clearInterval(checkInterval);
        };
    }, []);

    const setSelectedRole = (role: AgentRole | null) => {
        setSelectedRoleState(role);
        if (role) {
            localStorage.setItem('selected_role_id', role.role_id);
            localStorage.setItem('selected_role_type', role.role_type);
        } else {
            localStorage.removeItem('selected_role_id');
            localStorage.removeItem('selected_role_type');
        }
    };

    return (
        <RoleContext.Provider
            value={{
                selectedRole,
                availableRoles,
                loading,
                setSelectedRole,
                refreshRoles: loadRoles,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
};

