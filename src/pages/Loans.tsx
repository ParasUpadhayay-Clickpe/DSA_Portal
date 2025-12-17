import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { MainLayout } from '@/layouts/MainLayout';
import { DataTable, FilterPanel } from '@/components/common';
import type { Column, FilterConfig } from '@/components/common';
import { loansApi, entityRoleMappingApi, subAgentsApi } from '@/api';
import type { Loan } from '@/types/loans.types';
import type { AgentEntity } from '@/types/entityRoleMapping.types';
import { exportToExcel, type ExportColumn } from '@/utils/exportToExcel';
import styles from './Loans.module.css';

const SUB_STATUS_OPTIONS = [
    { label: 'FRESH_LOAN', value: 'FRESH_LOAN' },
    { label: 'LOAN_DETAILS_SUBMITTED', value: 'LOAN_DETAILS_SUBMITTED' },
    { label: 'UNDER_REVIEW', value: 'UNDER_REVIEW' },
    { label: 'KYC_SUCCESS', value: 'KYC_SUCCESS' },
    { label: 'KYC_REJECTED', value: 'KYC_REJECTED' },
    { label: 'BANK_ADDED', value: 'BANK_ADDED' },
    { label: 'SIGN_AGREEMENT', value: 'SIGN_AGREEMENT' },
    { label: 'DISBURSED', value: 'DISBURSED' },
    { label: 'LOAN_REJECTED', value: 'LOAN_REJECTED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
    { label: 'SKIP', value: 'SKIP' },
];

const LOAN_STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Active', value: 'Active' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Esign Completed', value: 'Esign Completed' },
];

const LENDER_OPTIONS = [
    { label: 'SPCBL', value: 'SPCBL' },
];

export const Loans: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const { selectedRole } = useRole();

    // Get agent context from URL parameters (when viewing sub-agent's loans)
    const agentIdOverride = searchParams.get('agentId') || null;
    const agentName = searchParams.get('agentName') || null;
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Sorting
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    // Filters
    const [filters, setFilters] = useState<Record<string, unknown>>({
        sub_status: [],
        loan_status: [],
        lender_id: null,
        filter_agent_id: null,
        search_text: '',
        search_type: null, // 'loan_id', 'mob_num', 'user_id', 'name'
        date_range_field: null, // Field selector: 'created_at' or 'updated_at'
        date_range: null, // Date range: [start, end]
        assigned_to_agent: null, // For Document Verifier: filter by assigned agent
    });

    // Available agents for Document Verifier role
    const [availableAgents, setAvailableAgents] = useState<Array<{ role_id: string; agent_name: string; agent_id: string }>>([]);
    const [loadingAgents, setLoadingAgents] = useState(false);

    // Sub-agents for agent filter dropdown
    const [subAgentOptions, setSubAgentOptions] = useState<Array<{ label: string; value: string }>>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    // Fetch sub-agents for agent filter dropdown
    useEffect(() => {
        const fetchSubAgents = async () => {
            const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
            if (!agentId) return;

            try {
                const response = await subAgentsApi.getSubAgents({ agent_id: agentId });
                if (response.response && response.response.length > 0) {
                    // Flatten the tree structure to get all agents
                    const flattenAgents = (agents: typeof response.response): Array<{ label: string; value: string }> => {
                        const result: Array<{ label: string; value: string }> = [];
                        agents.forEach((agent) => {
                            const name = [agent.fname, agent.mname, agent.lname].filter(Boolean).join(' ');
                            result.push({ label: name || agent.agent_id, value: agent.agent_id });
                            if (agent.children && agent.children.length > 0) {
                                result.push(...flattenAgents(agent.children));
                            }
                        });
                        return result;
                    };
                    setSubAgentOptions(flattenAgents(response.response));
                }
            } catch (err) {
                console.error('Failed to fetch sub-agents:', err);
            }
        };

        if (isAuthenticated) {
            fetchSubAgents();
        }
    }, [isAuthenticated]);

    // Fetch available agents for Document Verifier role
    useEffect(() => {
        const fetchAvailableAgents = async () => {
            if (!selectedRole || selectedRole.role_type !== 'DOCUMENT_VERIFIER') {
                setAvailableAgents([]);
                return;
            }

            const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
            if (!agentId) return;

            setLoadingAgents(true);
            try {
                const response = await entityRoleMappingApi.getAgents({
                    agent_id: agentId,
                    role_type: 'DOCUMENT_VERIFIER',
                });

                if (response.status === 'Success' && response.response) {
                    // Flatten the tree to get all agents
                    const flattenAgents = (nodes: typeof response.response.tree): Array<{ role_id: string; agent_name: string; agent_id: string }> => {
                        const agents: Array<{ role_id: string; agent_name: string; agent_id: string }> = [];
                        nodes.forEach((node) => {
                            agents.push({
                                role_id: node.role_id,
                                agent_name: node.agent_name,
                                agent_id: node.agent_id,
                            });
                            if (node.children && node.children.length > 0) {
                                agents.push(...flattenAgents(node.children));
                            }
                        });
                        return agents;
                    };

                    const agents = flattenAgents(response.response.tree);
                    setAvailableAgents(agents);
                }
            } catch (err) {
                console.error('Failed to fetch available agents:', err);
            } finally {
                setLoadingAgents(false);
            }
        };

        fetchAvailableAgents();
    }, [selectedRole]);

    const fetchLoans = useCallback(async () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
        if (!agentId) {
            setError('Agent ID not found');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get selected date range field and values (used in both branches)
            const dateRangeField = (filters.date_range_field as string) || null;
            const dateRange: [string | null, string | null] = Array.isArray(filters.date_range) && filters.date_range.length === 2
                ? [filters.date_range[0] as string | null, filters.date_range[1] as string | null]
                : [null, null];

            // Set the appropriate range based on selected field
            const createdAtRange: [string | null, string | null] = dateRangeField === 'created_at' ? dateRange : [null, null];
            const updatedAtRange: [string | null, string | null] = dateRangeField === 'updated_at' ? dateRange : [null, null];

            // If a role is selected, use get-agent-entity API
            if (selectedRole) {

                const sortByValue: { [key: string]: 1 | -1 } | undefined = sortBy
                    ? {
                        [`erm.${sortBy}`]: sortOrder === 'asc' ? 1 : -1,
                    }
                    : undefined;

                // If assigned_to_agent is selected, use that as role_id instead
                const effectiveRoleId = filters.assigned_to_agent
                    ? (filters.assigned_to_agent as string)
                    : selectedRole.role_id;

                const entityRequest = {
                    role_id: effectiveRoleId,
                    entity_type: 'loan_id',
                    role_type: selectedRole.role_type,
                    page,
                    page_size: pageSize,
                    sort_by: sortByValue,
                    filters: {
                        sub_status: Array.isArray(filters.sub_status) && filters.sub_status.length > 0
                            ? (filters.sub_status as string[])
                            : undefined,
                        loan_status: Array.isArray(filters.loan_status) && filters.loan_status.length > 0
                            ? (filters.loan_status as string[])
                            : undefined,
                        user_mob_num: filters.search_type === 'mob_num' && filters.search_text
                            ? (filters.search_text as string)
                            : undefined,
                        user_id: filters.search_type === 'user_id' && filters.search_text
                            ? (filters.search_text as string)
                            : undefined,
                    },
                    ranges: {
                        created_at: createdAtRange,
                        updated_at: updatedAtRange,
                    },
                    text: (filters.search_type === 'name' && filters.search_text) ? (filters.search_text as string) : undefined,
                    search_columns: undefined,
                };

                const entityResponse = await entityRoleMappingApi.getAgentEntities(entityRequest);

                if (entityResponse.status === 'Success' && entityResponse.response) {
                    // Convert AgentEntity to Loan format, preserving all fields
                    const convertedLoans: Loan[] = entityResponse.response.response.map((entity: AgentEntity) => ({
                        loan_id: entity.loan_id,
                        user_id: entity.user_id,
                        agent_id: entity.assigned_agent_id || '',
                        fname: entity.fname,
                        mname: entity.mname,
                        lname: entity.lname,
                        mob_num: entity.user_mob_num,
                        email: entity.user_email,
                        loan_created_at: entity.loan_created_at,
                        loan_updated_at: entity.loan_updated_at,
                        sub_status: entity.sub_status,
                        requested_amt: entity.requested_amt,
                        lender_approved_amt: entity.lender_approved_amt,
                        loan_tenure: entity.loan_tenure,
                        payment_frequency: entity.payment_frequency,
                        agent_name: entity.agent_name,
                        // Include all additional AgentEntity fields
                        assignment_date: entity.assignment_date,
                        assigned_by: entity.assigned_by,
                        assigned_agent_id: entity.assigned_agent_id,
                        assigned_to_agent: entity.assigned_to_agent,
                        // Spread any other fields that might exist
                        ...(entity as unknown as Record<string, unknown>),
                    } as Loan));
                    setLoans(convertedLoans);
                    setTotal(entityResponse.response.pagination?.total_records || convertedLoans.length);
                } else {
                    setError(entityResponse.message || 'Failed to fetch loans');
                }
            } else {
                // Default: Use regular agent loan API


                const sortByValue: { [key: string]: 1 | -1 } | undefined = sortBy
                    ? {
                        [sortBy]: sortOrder === 'asc' ? 1 : -1,
                    }
                    : undefined;

                // Build filters based on search type
                const searchText = (filters.search_text as string) || '';
                const searchType = filters.search_type as string;
                const filterAgentId = (filters.filter_agent_id as string) || null;

                // Use filtered agent_id if selected, otherwise use current agent
                const effectiveAgentId = filterAgentId || agentId;

                const request = {
                    query_type: 'new_get_agent_loans' as const,
                    agent_id: effectiveAgentId,
                    page,
                    page_size: pageSize,
                    ranges: {
                        created_at: createdAtRange,
                        updated_at: updatedAtRange,
                    },
                    sort_by: sortByValue,
                    filters: {
                        loan_id: searchType === 'loan_id' && searchText ? searchText : undefined,
                        sub_status: Array.isArray(filters.sub_status) && filters.sub_status.length > 0
                            ? (filters.sub_status as string[])
                            : undefined,
                        loan_status: Array.isArray(filters.loan_status) && filters.loan_status.length > 0
                            ? (filters.loan_status as string[])
                            : undefined,
                        lender_id: filters.lender_id ? (filters.lender_id as string) : undefined,
                        mob_num: searchType === 'mob_num' && searchText ? searchText : undefined,
                        'l.user_id': searchType === 'user_id' && searchText ? searchText : undefined,
                    },
                    text: (searchType === 'name' && searchText) ? searchText : undefined,
                    search_columns: undefined,
                };

                const response = await loansApi.getLoanDetails(request);

                if (response.response) {
                    setLoans(response.response);
                    setTotal(response.pagination_metadata?.total_records || response.response.length);
                } else {
                    setError(response.message || 'Failed to fetch loans');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch loans');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortBy, sortOrder, filters, selectedRole]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLoans();
        }
    }, [isAuthenticated, fetchLoans]);

    const handleSort = (key: string, order: 'asc' | 'desc') => {
        setSortBy(key);
        setSortOrder(order);
        setPage(1);
    };

    const handleFilterChange = (key: string, value: unknown) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            sub_status: [],
            loan_status: [],
            lender_id: null,
            filter_agent_id: null,
            search_text: '',
            search_type: null,
            date_range_field: null,
            date_range: null,
            assigned_to_agent: null,
        });
        setPage(1);
    };

    // Handle changing assigned agent
    const [changingAssignment, setChangingAssignment] = useState<string | null>(null);
    const [newAssignedAgent, setNewAssignedAgent] = useState<string>('');

    const handleChangeAssignment = async (loanId: string, currentAssignedRoleId: string | undefined) => {
        if (!selectedRole || !newAssignedAgent) return;

        setChangingAssignment(loanId);
        try {
            const response = await entityRoleMappingApi.changeEntityMapping({
                entity_id: loanId,
                entity_type: 'loan_id',
                role_type: selectedRole.role_type,
                assigned_by: selectedRole.role_id, // Current user's role ID
                assigned_to: newAssignedAgent, // New agent's role ID
            });

            if (response.status === 'Success') {
                // Refresh the loans list
                await fetchLoans();
                setNewAssignedAgent('');
                setChangingAssignment(null);
            } else {
                setError(response.message || 'Failed to change assignment');
                setChangingAssignment(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change assignment');
            setChangingAssignment(null);
        }
    };

    const handleExportToExcel = () => {
        if (loans.length === 0) {
            return;
        }

        // Convert columns to export format, handling React node renders
        const exportColumns: ExportColumn<Loan>[] = allColumns.map((col) => {
            if (!col.render) {
                return {
                    key: col.key,
                    label: col.label,
                };
            }

            // For columns with render functions, extract the actual value
            return {
                key: col.key,
                label: col.label,
                render: (value: unknown, row: Loan) => {
                    // Get the raw value from the row instead of using render
                    const rawValue = (row as unknown as Record<string, unknown>)[col.key];

                    // Handle specific column types
                    if (col.key === 'name') {
                        const name = [row.fname, row.mname, row.lname].filter(Boolean).join(' ');
                        return name || '-';
                    }
                    if (col.key === 'sub_status' || col.key === 'loan_status') {
                        return String(rawValue || '-');
                    }
                    if (col.key === 'requested_amt' || col.key === 'lender_approved_amt' || col.key === 'disbursed_amt') {
                        return rawValue ? Number(rawValue) : 0;
                    }
                    if (col.key === 'loan_interest_rate') {
                        return rawValue ? `${Number(rawValue)}%` : '-';
                    }
                    if (col.key.includes('_date') || col.key.includes('created_at') || col.key.includes('updated_at')) {
                        if (!rawValue) return '-';
                        try {
                            return new Date(rawValue as string).toLocaleString();
                        } catch {
                            return String(rawValue);
                        }
                    }

                    // Default: return string representation
                    if (rawValue === null || rawValue === undefined) {
                        return '-';
                    }
                    return String(rawValue);
                },
            };
        });

        exportToExcel(loans as unknown as Record<string, unknown>[], exportColumns as unknown as ExportColumn<Record<string, unknown>>[], 'loans');
    };

    const SEARCH_TYPE_OPTIONS = [
        { label: 'Loan ID', value: 'loan_id' },
        { label: 'Mobile Number', value: 'mob_num' },
        { label: 'User ID', value: 'user_id' },
        { label: 'Name', value: 'name' },
    ];

    // Build filter configs - add Assigned To filter only for Document Verifier role
    const filterConfigs: FilterConfig[] = [
        {
            key: 'search_type',
            label: 'Search Type',
            type: 'select',
            options: SEARCH_TYPE_OPTIONS,
        },
        {
            key: 'search_text',
            label: 'Search',
            type: 'text',
            placeholder: 'Enter search text...',
        },
        {
            key: 'sub_status',
            label: 'Sub Status',
            type: 'multiSelect',
            options: SUB_STATUS_OPTIONS,
        },
        {
            key: 'loan_status',
            label: 'Loan Status',
            type: 'multiSelect',
            options: LOAN_STATUS_OPTIONS,
        },
        {
            key: 'lender_id',
            label: 'Lender',
            type: 'select',
            options: LENDER_OPTIONS,
        },
        {
            key: 'filter_agent_id',
            label: 'Agent',
            type: 'searchableSelect',
            options: subAgentOptions,
            placeholder: 'Select agent...',
        },
        ...(selectedRole?.role_type === 'DOCUMENT_VERIFIER'
            ? [
                {
                    key: 'assigned_to_agent',
                    label: 'Assigned To',
                    type: 'select',
                    options: [
                        { label: 'All Agents', value: null },
                        ...availableAgents.map((agent) => ({
                            label: agent.agent_name,
                            value: agent.role_id,
                        })),
                    ],
                } as FilterConfig,
            ]
            : []),
        {
            key: 'date_range',
            label: 'Date Range',
            type: 'dateRangeField',
            dateRangeFields: [
                { label: 'Created At', value: 'created_at' },
                { label: 'Updated At', value: 'updated_at' },
            ],
        },
    ];

    const columns: Column<Loan>[] = [
        {
            key: 'loan_id',
            label: 'Loan ID',
            sortable: true,
            defaultVisible: true,
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            defaultVisible: true,
            render: (_, row) => {
                const name = [row.fname, row.mname, row.lname].filter(Boolean).join(' ');
                return name || '-';
            },
        },
        {
            key: 'mob_num',
            label: 'Mobile',
            sortable: true,
            defaultVisible: true,
        },
        {
            key: 'sub_status',
            label: 'Status',
            sortable: true,
            defaultVisible: true,
            render: (value) => {
                const status = String(value || '');
                const statusColors: Record<string, string> = {
                    DISBURSED: '#10b981',
                    APPROVED: '#10b981',
                    PENDING: '#f59e0b',
                    REJECTED: '#ef4444',
                    UNDER_REVIEW: '#3b82f6',
                    KYC_SUCCESS: '#10b981',
                    KYC_REJECTED: '#ef4444',
                    FRESH_LOAN: '#6b7280',
                    LOAN_DETAILS_SUBMITTED: '#3b82f6',
                    BANK_ADDED: '#3b82f6',
                    SIGN_AGREEMENT: '#f59e0b',
                    CANCELLED: '#ef4444',
                    SKIP: '#9ca3af',
                };
                return (
                    <span
                        style={{
                            color: statusColors[status] || '#6b7280',
                            fontWeight: 500,
                        }}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            key: 'requested_amt',
            label: 'Requested Amount',
            sortable: true,
            defaultVisible: true,
            render: (value) => {
                if (!value) return '-';
                return `₹${Number(value).toLocaleString()}`;
            },
        },
        {
            key: 'lender_approved_amt',
            label: 'Approved Amount',
            sortable: true,
            defaultVisible: true,
            render: (value) => {
                if (!value) return '-';
                return `₹${Number(value).toLocaleString()}`;
            },
        },
        {
            key: 'disbursed_amt',
            label: 'Disbursed Amount',
            sortable: true,
            defaultVisible: false,
            render: (value) => {
                if (!value) return '-';
                return `₹${Number(value).toLocaleString()}`;
            },
        },
        {
            key: 'loan_tenure',
            label: 'Tenure (Months)',
            sortable: true,
            defaultVisible: false,
        },
        {
            key: 'loan_interest_rate',
            label: 'Interest Rate',
            sortable: true,
            defaultVisible: false,
            render: (value) => {
                if (!value) return '-';
                return `${Number(value)}%`;
            },
        },
        {
            key: 'disbursed_date',
            label: 'Disbursed Date',
            sortable: true,
            defaultVisible: false,
            render: (value) => {
                if (!value) return '-';
                try {
                    return new Date(value as string).toLocaleDateString();
                } catch {
                    return String(value);
                }
            },
        },
        {
            key: 'loan_created_at',
            label: 'Created At',
            sortable: true,
            defaultVisible: true,
            render: (value) => {
                if (!value) return '-';
                try {
                    return new Date(value as string).toLocaleDateString();
                } catch {
                    return String(value);
                }
            },
        },
        {
            key: 'loan_updated_at',
            label: 'Updated At',
            sortable: true,
            defaultVisible: false,
            render: (value) => {
                if (!value) return '-';
                try {
                    return new Date(value as string).toLocaleDateString();
                } catch {
                    return String(value);
                }
            },
        },
        {
            key: 'agent_name',
            label: 'Agent Name',
            sortable: true,
            defaultVisible: false,
            render: (value, row) => {
                if (value) return String(value);
                // Lookup agent name from subAgentOptions using agent_id
                const agentId = row.agent_id;
                if (agentId) {
                    const agent = subAgentOptions.find(a => a.value === agentId);
                    if (agent) return agent.label;
                }
                return '-';
            },
        },
        {
            key: 'loan_type',
            label: 'Loan Type',
            sortable: true,
            defaultVisible: false,
        },
        {
            key: 'payment_frequency',
            label: 'Payment Frequency',
            sortable: true,
            defaultVisible: false,
        },
        // Add Assigned Agent column for Document Verifier role
        ...(selectedRole?.role_type === 'DOCUMENT_VERIFIER'
            ? [
                {
                    key: 'assigned_to_agent',
                    label: 'Assigned To',
                    sortable: true,
                    defaultVisible: true,
                    render: (value, row): ReactNode => {
                        const currentAssignedRoleId = (row as unknown as Record<string, unknown>).assigned_agent_id as string | undefined;
                        const isChanging = changingAssignment === row.loan_id;

                        if (isChanging) {
                            return (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <select
                                        value={newAssignedAgent}
                                        onChange={(e) => setNewAssignedAgent(e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="">Select Agent</option>
                                        {availableAgents.map((agent) => (
                                            <option key={agent.role_id} value={agent.role_id}>
                                                {agent.agent_name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (newAssignedAgent) {
                                                handleChangeAssignment(row.loan_id, currentAssignedRoleId);
                                            }
                                        }}
                                        disabled={!newAssignedAgent}
                                        style={{
                                            padding: '4px 12px',
                                            background: '#1565d8',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: newAssignedAgent ? 'pointer' : 'not-allowed',
                                            opacity: newAssignedAgent ? 1 : 0.5,
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNewAssignedAgent('');
                                            setChangingAssignment(null);
                                        }}
                                        style={{
                                            padding: '4px 12px',
                                            background: '#6b7280',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            );
                        }

                        const assignedAgent = availableAgents.find((a) => a.role_id === currentAssignedRoleId);
                        return (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>{assignedAgent?.agent_name || (value ? String(value) : 'Unassigned')}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChangingAssignment(row.loan_id);
                                        setNewAssignedAgent(currentAssignedRoleId || '');
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                    title="Change assignment"
                                >
                                    Change
                                </button>
                            </div>
                        );
                    },
                } as Column<Loan>,
            ]
            : []),
    ];

    // Dynamically generate columns for all other Loan fields not already defined
    const dynamicColumns = useMemo(() => {
        if (loans.length === 0) return [];

        // Get all keys from the first loan
        const allKeys = Object.keys(loans[0] || {}) as (keyof Loan)[];

        // Get keys that are already defined in the static columns
        const definedKeys = new Set(columns.map(col => col.key));

        // Filter out keys that are already defined
        const remainingKeys = allKeys.filter(key => !definedKeys.has(String(key)));

        // Generate column definitions for remaining keys
        return remainingKeys.map(key => {
            const label = String(key)
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());

            // Determine render function based on key patterns
            let render: ((value: unknown, row: Loan) => React.ReactNode) | undefined;

            // Amount fields
            if (key.toString().includes('_amt') || key.toString().includes('amount') || key === 'income' || key === 'total_pre_disbursal_charges') {
                render = (value) => {
                    if (!value) return '-';
                    return `₹${Number(value).toLocaleString()}`;
                };
            }
            // Percentage fields
            else if (key.toString().includes('percentage') || key.toString().includes('rate') || key.toString().includes('apr')) {
                render = (value) => {
                    if (!value) return '-';
                    return `${String(value)}%`;
                };
            }
            // Date fields
            else if (key.toString().includes('_date') || key.toString().includes('created_at') || key.toString().includes('updated_at') || key === 'dob') {
                render = (value) => {
                    if (!value) return '-';
                    try {
                        return new Date(value as string).toLocaleDateString();
                    } catch {
                        return String(value);
                    }
                };
            }
            // Boolean fields
            else if (key === 'is_active' || key === 'is_politically_exposed' || key === 'salaried') {
                render = (value) => {
                    if (value === null || value === undefined) return '-';
                    return value ? 'Yes' : 'No';
                };
            }
            // Default: just display the value
            else {
                render = (value) => {
                    if (value === null || value === undefined) return '-';
                    return String(value);
                };
            }

            return {
                key: String(key),
                label,
                sortable: true,
                defaultVisible: false,
                render,
            } as Column<Loan>;
        });
    }, [loans]);

    // Combine static and dynamic columns
    const allColumns = useMemo(() => {
        return [...columns, ...dynamicColumns];
    }, [columns, dynamicColumns]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <div className={styles.pageContainer}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            Loans
                            {agentName && (
                                <span className={styles.agentContext}> - {agentName}</span>
                            )}
                        </h1>
                        {agentName && (
                            <p className={styles.agentContextInfo}>
                                Viewing loans for: {agentName} (ID: {agentIdOverride})
                            </p>
                        )}
                    </div>
                    <button
                        className={styles.exportButton}
                        onClick={() => handleExportToExcel()}
                        disabled={loading || loans.length === 0}
                        title="Export to Excel"
                    >
                        📥 Export to Excel
                    </button>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <FilterPanel
                    filters={filterConfigs}
                    values={filters}
                    onChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                <DataTable
                    data={loans}
                    columns={allColumns}
                    loading={loading}
                    tableId={selectedRole ? `loans_${selectedRole.role_type}` : 'loans'}
                    pagination={{
                        page,
                        pageSize,
                        total,
                        onPageChange: setPage,
                        onPageSizeChange: (newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        },
                    }}
                    sorting={{
                        sortBy,
                        sortOrder,
                        onSort: handleSort,
                    }}
                    onRowClick={(row) => {
                        // Preserve agent context when navigating to loan detail
                        const params = new URLSearchParams();
                        if (agentIdOverride) params.set('agentId', agentIdOverride);
                        if (agentName) params.set('agentName', agentName);
                        const queryString = params.toString();
                        navigate(`/loans/${row.loan_id}${queryString ? `?${queryString}` : ''}`, { state: { loan: row } });
                    }}
                    emptyMessage="No loans found"
                />
            </div>
        </MainLayout>
    );
};

