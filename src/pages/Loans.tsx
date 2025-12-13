import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { MainLayout } from '@/layouts/MainLayout';
import { DataTable, FilterPanel } from '@/components/common';
import type { Column, FilterConfig } from '@/components/common';
import { loansApi, entityRoleMappingApi } from '@/api';
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

export const Loans: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { selectedRole } = useRole();
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
        loan_id: '',
        sub_status: null,
        mob_num: '',
        user_id: '',
        created_at: [null, null],
        updated_at: [null, null],
        text: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    const fetchLoans = useCallback(async () => {
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
        if (!agentId) {
            setError('Agent ID not found');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // If a role is selected, use get-agent-entity API
            if (selectedRole) {
                const createdAtRange: [string | null, string | null] = Array.isArray(filters.created_at) && filters.created_at.length === 2
                    ? [filters.created_at[0] as string | null, filters.created_at[1] as string | null]
                    : [null, null];

                const sortByValue: { [key: string]: 1 | -1 } | undefined = sortBy
                    ? {
                        [`erm.${sortBy}`]: sortOrder === 'asc' ? 1 : -1,
                    }
                    : undefined;

                const entityRequest = {
                    role_id: selectedRole.role_id,
                    entity_type: 'loan_id',
                    role_type: selectedRole.role_type,
                    page,
                    page_size: pageSize,
                    sort_by: sortByValue,
                    filters: {
                        sub_status:
                            filters.sub_status && Array.isArray(filters.sub_status)
                                ? (filters.sub_status as string[])
                                : filters.sub_status
                                    ? [filters.sub_status as string]
                                    : undefined,
                        user_mob_num: (filters.mob_num as string) || undefined,
                        user_id: (filters.user_id as string) || undefined,
                    },
                    ranges: {
                        created_at: createdAtRange,
                    },
                    text: (filters.text as string) || undefined,
                    search_columns: (filters.text as string) ? ['fname', 'mname', 'lname'] : undefined,
                };

                const entityResponse = await entityRoleMappingApi.getAgentEntities(entityRequest);

                if (entityResponse.status === 'Success' && entityResponse.response) {
                    // Convert AgentEntity to Loan format
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
                    }));
                    setLoans(convertedLoans);
                    setTotal(entityResponse.response.pagination?.total_records || convertedLoans.length);
                } else {
                    setError(entityResponse.message || 'Failed to fetch loans');
                }
            } else {
                // Default: Use regular agent loan API
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

                const request = {
                    query_type: 'agent_all_loan' as const,
                    agent_id: agentId,
                    page,
                    page_size: pageSize,
                    ranges: {
                        created_at: createdAtRange,
                        updated_at: updatedAtRange,
                    },
                    sort_by: sortByValue,
                    filters: {
                        loan_id: (filters.loan_id as string) || undefined,
                        sub_status:
                            filters.sub_status && Array.isArray(filters.sub_status)
                                ? (filters.sub_status as string[])
                                : filters.sub_status
                                    ? [filters.sub_status as string]
                                    : undefined,
                        mob_num: (filters.mob_num as string) || undefined,
                        'l.user_id': (filters.user_id as string) || undefined,
                    },
                    text: (filters.text as string) || undefined,
                    search_columns: (filters.text as string) ? ['fname', 'mname', 'lname'] : undefined,
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
            loan_id: '',
            sub_status: null,
            mob_num: '',
            user_id: '',
            created_at: [null, null],
            updated_at: [null, null],
            text: '',
        });
        setPage(1);
    };

    const handleExportToExcel = () => {
        if (loans.length === 0) {
            return;
        }

        // Convert columns to export format, handling React node renders
        const exportColumns: ExportColumn<Loan>[] = columns.map((col) => {
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

    const filterConfigs: FilterConfig[] = [
        {
            key: 'loan_id',
            label: 'Loan ID',
            type: 'text',
            placeholder: 'Enter loan ID...',
        },
        {
            key: 'sub_status',
            label: 'Sub Status',
            type: 'select',
            options: SUB_STATUS_OPTIONS,
        },
        {
            key: 'mob_num',
            label: 'Mobile Number',
            type: 'text',
            placeholder: 'Enter mobile number...',
        },
        {
            key: 'user_id',
            label: 'User ID',
            type: 'text',
            placeholder: 'Enter user ID...',
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
            key: 'text',
            label: 'Search Name',
            type: 'text',
            placeholder: 'Search by name...',
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
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <div className={styles.pageContainer}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Loans</h1>
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

                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search titles..."
                        className={styles.searchInput}
                        value={(filters.text as string) || ''}
                        onChange={(e) => handleFilterChange('text', e.target.value)}
                    />
                </div>

                <DataTable
                    data={loans}
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
                    onRowClick={(row) => navigate(`/loans/${row.loan_id}`, { state: { loan: row } })}
                    emptyMessage="No loans found"
                />
            </div>
        </MainLayout>
    );
};

