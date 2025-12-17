import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { MainLayout } from '@/layouts/MainLayout';
import { subAgentsApi, entityRoleMappingApi } from '@/api';
import type { SubAgent } from '@/types/subagents.types';
import type { RoleTreeNode } from '@/types/entityRoleMapping.types';
import styles from './SubAgents.module.css';

interface AgentTreeNodeProps {
    agent: SubAgent;
    level: number;
    searchQuery: string;
    forceExpand?: boolean;
    onAgentClick?: (agent: SubAgent) => void;
}

const AgentTreeNode: React.FC<AgentTreeNodeProps> = ({ agent, level, searchQuery, forceExpand = false, onAgentClick }) => {
    const [isExpanded, setIsExpanded] = useState(level === 0 || forceExpand);
    const hasChildren = agent.children && agent.children.length > 0;

    // Check if this agent matches the search query
    const matchesSearch = useMemo(() => {
        if (!searchQuery) return false;
        const query = searchQuery.toLowerCase();
        const name = [agent.fname, agent.mname, agent.lname].filter(Boolean).join(' ').toLowerCase();
        const agentId = agent.agent_id.toLowerCase();
        const mobile = String(agent.mob_num).toLowerCase();

        return name.includes(query) || agentId.includes(query) || mobile.includes(query);
    }, [searchQuery, agent]);

    // Check if any children match
    const hasMatchingChildren = useMemo(() => {
        if (!searchQuery || !hasChildren) return false;
        const checkChildren = (children: SubAgent[]): boolean => {
            return children.some(child => {
                const query = searchQuery.toLowerCase();
                const name = [child.fname, child.mname, child.lname].filter(Boolean).join(' ').toLowerCase();
                const agentId = child.agent_id.toLowerCase();
                const mobile = String(child.mob_num).toLowerCase();
                const childMatches = name.includes(query) || agentId.includes(query) || mobile.includes(query);
                return childMatches || (child.children && checkChildren(child.children));
            });
        };
        return checkChildren(agent.children);
    }, [searchQuery, agent, hasChildren]);

    // Auto-expand if has matching children
    useEffect(() => {
        if (hasMatchingChildren && !isExpanded) {
            setIsExpanded(true);
        }
    }, [hasMatchingChildren, isExpanded]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return '#10b981';
            case 'inactive':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getName = () => {
        return [agent.fname, agent.mname, agent.lname].filter(Boolean).join(' ') || agent.name || 'Unknown';
    };

    // Highlight matching text
    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className={styles.highlight}>{part}</mark>
            ) : (
                part
            )
        );
    };

    // Don't render if search is active and doesn't match and has no matching children
    if (searchQuery && !matchesSearch && !hasMatchingChildren) {
        return null;
    }

    return (
        <div className={styles.treeNode}>
            <div
                className={`${styles.nodeContent} ${matchesSearch ? styles.matched : ''}`}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
                {hasChildren && (
                    <button
                        className={styles.expandButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                )}
                {!hasChildren && <span className={styles.spacer} />}

                <div
                    className={styles.agentInfo}
                    onClick={() => onAgentClick && onAgentClick(agent)}
                    style={{ cursor: onAgentClick ? 'pointer' : 'default' }}
                >
                    <div className={styles.agentMain}>
                        <span className={styles.agentName}>
                            {searchQuery ? highlightText(getName(), searchQuery) : getName()}
                        </span>
                        <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(agent.status) }}
                        >
                            {agent.status}
                        </span>
                    </div>
                    <div className={styles.agentDetails}>
                        <span className={styles.agentId}>
                            ID: {searchQuery ? highlightText(agent.agent_id, searchQuery) : agent.agent_id}
                        </span>
                        <span className={styles.separator}>•</span>
                        <span className={styles.mobile}>
                            Mobile: {searchQuery ? highlightText(String(agent.mob_num), searchQuery) : agent.mob_num}
                        </span>
                        {agent.email && (
                            <>
                                <span className={styles.separator}>•</span>
                                <span className={styles.email}>{agent.email}</span>
                            </>
                        )}
                        <span className={styles.separator}>•</span>
                        <span className={styles.depth}>Depth: {agent.depth}</span>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className={styles.children}>
                    {agent.children.map((child) => (
                        <AgentTreeNode
                            key={child.agent_id}
                            agent={child}
                            level={level + 1}
                            searchQuery={searchQuery}
                            forceExpand={hasMatchingChildren}
                            onAgentClick={onAgentClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Convert RoleTreeNode to SubAgent format
const convertRoleTreeToSubAgent = (roleNode: RoleTreeNode, depth: number = 0): SubAgent => {
    const nameParts = roleNode.agent_name ? roleNode.agent_name.split(' ') : [];
    return {
        agent_id: roleNode.agent_id,
        fname: nameParts[0] || '',
        mname: '',
        lname: nameParts.slice(1).join(' ') || '',
        name: roleNode.agent_name || '',
        mob_num: 0, // Role tree doesn't provide mobile
        email: '',
        depth,
        is_active: true,
        status: 'active',
        children: (roleNode.children && Array.isArray(roleNode.children))
            ? roleNode.children.map((child) => convertRoleTreeToSubAgent(child, depth + 1))
            : [],
    };
};

export const SubAgents: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { selectedRole } = useRole();
    const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAgentClick = (agent: SubAgent) => {
        const agentName = [agent.fname, agent.mname, agent.lname].filter(Boolean).join(' ') || agent.name || 'Agent';
        const params = new URLSearchParams();
        params.set('agentId', agent.agent_id);
        params.set('agentName', agentName);
        params.set('agentMobNum', String(agent.mob_num));
        if (agent.email) {
            params.set('agentEmail', agent.email);
        }

        // Open leads page in new tab with agent context
        window.open(`/leads?${params.toString()}`, '_blank');
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubAgents();
        }
    }, [isAuthenticated, selectedRole]);

    const fetchSubAgents = async () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
        if (!agentId) {
            setError('Agent ID not found');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // If a role is selected, use get-agents (role tree) API
            if (selectedRole) {
                const response = await entityRoleMappingApi.getAgents({
                    agent_id: agentId,
                    role_type: selectedRole.role_type,
                });

                if (response.status === 'Success' && response.response && response.response.tree) {
                    // Convert role tree to SubAgent format
                    const convertedAgents = response.response.tree.map((treeNode) =>
                        convertRoleTreeToSubAgent(treeNode, 0)
                    );
                    setSubAgents(convertedAgents);
                } else {
                    setError(response.message || 'No agents found for this role');
                }
            } else {
                // Default: Use regular sub agents API
                const response = await subAgentsApi.getSubAgents({ agent_id: agentId });

                if (response.response && response.response.length > 0) {
                    setSubAgents(response.response);
                } else {
                    setError(response.message || 'No sub agents found');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch sub agents');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <div className={styles.pageContainer}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Sub Agents</h1>
                        {selectedRole && (
                            <p className={styles.roleIndicator}>
                                Viewing: {selectedRole.role_type.replace('_', ' ')} role tree
                            </p>
                        )}
                        {!selectedRole && (
                            <p className={styles.roleIndicator}>Viewing: Agent hierarchy</p>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.refreshButton}
                            onClick={fetchSubAgents}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                {!loading && subAgents.length > 0 && (
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search by name, mobile number, or agent ID..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearButton}
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {loading && subAgents.length === 0 ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}>Loading sub agents...</div>
                    </div>
                ) : subAgents.length === 0 ? (
                    <div className={styles.emptyContainer}>
                        <p>No sub agents found</p>
                    </div>
                ) : (
                    <div className={styles.treeContainer}>
                        {subAgents.map((agent) => (
                            <AgentTreeNode
                                key={agent.agent_id}
                                agent={agent}
                                level={0}
                                searchQuery={searchQuery}
                            />
                        ))}
                        {searchQuery && (
                            <div className={styles.searchInfo}>
                                <p>
                                    {searchQuery ? 'Showing filtered results' : 'Showing all sub agents'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

