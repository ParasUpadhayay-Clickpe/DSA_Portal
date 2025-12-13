import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { DataTable, FilterPanel } from '@/components/common';
import type { Column, FilterConfig } from '@/components/common';
import { leadsApi } from '@/api';
import type { UserLead } from '@/types/leads.types';
import { exportToExcel, type ExportColumn } from '@/utils/exportToExcel';
import styles from './Leads.module.css';

const LOAN_STATUS_OPTIONS = [
    { label: 'APPROVED', value: 'APPROVED' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'REJECTED', value: 'REJECTED' },
    { label: 'UNDER_REVIEW', value: 'UNDER_REVIEW' },
    { label: 'KYC_SUCCESS', value: 'KYC_SUCCESS' },
    { label: 'KYC_REJECTED', value: 'KYC_REJECTED' },
];

const SEARCH_TYPE_OPTIONS = [
    { label: 'Mobile Number', value: 'number' },
    { label: 'Name', value: 'name' },
    { label: 'User ID', value: 'id' },
    { label: 'Email', value: 'email' },
    { label: 'Agent Name', value: 'agent_name' },
];

export const Leads: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [leads, setLeads] = useState<UserLead[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateLeadMenu, setShowCreateLeadMenu] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Sorting
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    // Filters
    const [filters, setFilters] = useState<Record<string, unknown>>({
        loan_status: null,
        created_at: [null, null],
        updated_at: [null, null],
        search_text: '',
        search_type: null,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    const fetchLeads = useCallback(async () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
        if (!agentId) {
            setError('Agent ID not found');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Ensure date ranges are proper tuples
            const createdAtRange: [string | null, string | null] = Array.isArray(filters.created_at) && filters.created_at.length === 2
                ? [filters.created_at[0] as string | null, filters.created_at[1] as string | null]
                : [null, null];

            const updatedAtRange: [string | null, string | null] = Array.isArray(filters.updated_at) && filters.updated_at.length === 2
                ? [filters.updated_at[0] as string | null, filters.updated_at[1] as string | null]
                : [null, null];

            const sortByValue: { [key: string]: 1 | -1 } | undefined = sortBy
                ? {
                    [sortBy]: sortOrder === 'asc' ? 1 : -1,
                }
                : undefined;

            const searchTypeValue: 'number' | 'name' | 'id' | 'email' | 'agent_name' | undefined =
                filters.search_type
                    ? (filters.search_type as 'number' | 'name' | 'id' | 'email' | 'agent_name')
                    : undefined;

            const request = {
                agent_id: agentId,
                page,
                page_size: pageSize,
                ranges: {
                    created_at: createdAtRange,
                    updated_at: updatedAtRange,
                },
                sort_by: sortByValue,
                filters: {
                    loan_status:
                        filters.loan_status && Array.isArray(filters.loan_status)
                            ? (filters.loan_status as string[])
                            : filters.loan_status
                                ? [filters.loan_status as string]
                                : undefined,
                },
                search_text: (filters.search_text as string) || undefined,
                search_type: searchTypeValue,
            };

            const response = await leadsApi.getUsersFromAgentId(request);

            if (response.response) {
                setLeads(response.response);
                setTotal(response.pagination_metadata?.total_records || response.response.length);
            } else {
                setError(response.message || 'Failed to fetch leads');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch leads');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortBy, sortOrder, filters]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        }
    }, [isAuthenticated, fetchLeads]);

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
            loan_status: null,
            created_at: [null, null],
            updated_at: [null, null],
            search_text: '',
            search_type: null,
        });
        setPage(1);
    };

    const handleExportToExcel = () => {
        if (leads.length === 0) {
            return;
        }

        // Convert columns to export format, handling React node renders
        const exportColumns: ExportColumn<UserLead>[] = columns.map((col) => {
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
                render: (value: unknown, row: UserLead) => {
                    // Get the raw value from the row instead of using render
                    const rawValue = (row as unknown as Record<string, unknown>)[col.key];

                    // Handle specific column types
                    if (col.key === 'name') {
                        const name = [row.fname, row.mname, row.lname].filter(Boolean).join(' ');
                        return name || '-';
                    }
                    if (col.key === 'application_status' || col.key === 'loan_status') {
                        return String(rawValue || '-');
                    }
                    if (col.key === 'income') {
                        return rawValue ? Number(rawValue) : 0;
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

        exportToExcel(leads as unknown as Record<string, unknown>[], exportColumns as unknown as ExportColumn<Record<string, unknown>>[], 'leads');
    };

    const handleCreateLead = (type: 'allLenders' | 'muthootEDI') => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId') || '';
        const agentMobNum = localStorage.getItem('agentMobNum') || '';

        if (!agentId) {
            alert('Agent ID not found');
            return;
        }

        let url = '';
        if (type === 'allLenders') {
            url = `https://login.clickpe.ai/login?agentId=${agentId}&m=${agentMobNum}`;
        } else {
            url = `https://muthoot.clickpe.ai/?agentId=${agentId}&m=${agentMobNum}`;
        }

        window.open(url, '_blank');
        setShowCreateLeadMenu(false);
    };

    const filterConfigs: FilterConfig[] = [
        {
            key: 'loan_status',
            label: 'Loan Status',
            type: 'select',
            options: LOAN_STATUS_OPTIONS,
        },
        {
            key: 'created_at',
            label: 'Created At',
            type: 'dateRange',
        },
        {
            key: 'updated_at',
            label: 'Updated At',
            type: 'dateRange',
        },
        {
            key: 'search_text',
            label: 'Search',
            type: 'text',
            placeholder: 'Enter search text...',
        },
        {
            key: 'search_type',
            label: 'Search Type',
            type: 'select',
            options: SEARCH_TYPE_OPTIONS,
        },
    ];

    const columns: Column<UserLead>[] = [
        {
            key: 'user_id',
            label: 'User ID',
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
            key: 'email',
            label: 'Email',
            sortable: true,
            defaultVisible: true,
        },
        {
            key: 'application_status',
            label: 'Status',
            sortable: true,
            defaultVisible: true,
            render: (value) => {
                const status = String(value || '');
                const statusColors: Record<string, string> = {
                    APPROVED: '#10b981',
                    PENDING: '#f59e0b',
                    REJECTED: '#ef4444',
                    UNDER_REVIEW: '#3b82f6',
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
            key: 'agent_name',
            label: 'Agent Name',
            sortable: true,
            defaultVisible: true,
        },
        {
            key: 'created_at',
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
            key: 'updated_at',
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
            key: 'income',
            label: 'Income',
            sortable: true,
            defaultVisible: false,
            render: (value) => {
                if (!value) return '-';
                return `₹${Number(value).toLocaleString()}`;
            },
        },
        {
            key: 'occupation',
            label: 'Occupation',
            sortable: true,
            defaultVisible: false,
        },
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <div className={styles.pageContainer}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Leads</h1>
                    <div className={styles.headerActions}>
                        <div className={styles.createLeadContainer}>
                            <button
                                className={styles.createLeadButton}
                                onClick={() => setShowCreateLeadMenu(!showCreateLeadMenu)}
                                title="Create New Lead"
                            >
                                + Create New Lead
                            </button>
                            {showCreateLeadMenu && (
                                <>
                                    <div
                                        className={styles.menuOverlay}
                                        onClick={() => setShowCreateLeadMenu(false)}
                                    />
                                    <div className={styles.createLeadMenu}>
                                        <button
                                            className={styles.menuItem}
                                            onClick={() => handleCreateLead('allLenders')}
                                        >
                                            All lenders
                                        </button>
                                        <button
                                            className={styles.menuItem}
                                            onClick={() => handleCreateLead('muthootEDI')}
                                        >
                                            Muthoot EDI
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            className={styles.exportButton}
                            onClick={() => handleExportToExcel()}
                            disabled={loading || leads.length === 0}
                            title="Export to Excel"
                        >
                            📥 Export to Excel
                        </button>
                    </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <FilterPanel
                    filters={filterConfigs}
                    values={filters}
                    onChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search titles..."
                        className={styles.searchInput}
                        value={(filters.search_text as string) || ''}
                        onChange={(e) => handleFilterChange('search_text', e.target.value)}
                    />
                </div>

                <DataTable
                    data={leads}
                    columns={columns}
                    loading={loading}
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
                    onRowClick={(row) => navigate(`/customer/${row.user_id}`, { state: { lead: row } })}
                    emptyMessage="No leads found"
                />
            </div>
        </MainLayout>
    );
};

