import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/layouts/MainLayout";
import { DataTable, FilterPanel } from "@/components/common";
import type { Column, FilterConfig } from "@/components/common";
import { leadsApi } from "@/api";
import type { UserLead } from "@/types/leads.types";
import { exportToExcel, type ExportColumn } from "@/utils/exportToExcel";
import styles from "./Leads.module.css";

const LOAN_STATUS_OPTIONS = [
  { label: "APPROVED", value: "APPROVED" },
  { label: "PENDING", value: "PENDING" },
  { label: "REJECTED", value: "REJECTED" },
  { label: "UNDER_REVIEW", value: "UNDER_REVIEW" },
  { label: "KYC_SUCCESS", value: "KYC_SUCCESS" },
  { label: "KYC_REJECTED", value: "KYC_REJECTED" },
];

const SEARCH_TYPE_OPTIONS = [
  { label: "Mobile Number", value: "number" },
  { label: "Name", value: "name" },
  { label: "User ID", value: "id" },
  { label: "Email", value: "email" },
  { label: "Agent Name", value: "agent_name" },
];

export const Leads: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [leads, setLeads] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateLeadMenu, setShowCreateLeadMenu] = useState(false);

  const agentIdOverride = searchParams.get("agentId") || null;
  const agentName = searchParams.get("agentName") || null;
  const agentMobNum = searchParams.get("agentMobNum") || null;
  const agentEmail = searchParams.get("agentEmail") || null;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const [filters, setFilters] = useState<Record<string, unknown>>({
    loan_status: null,
    date_range_field: null,
    date_range: null,
    search_text: "",
    search_type: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/agent-login");
    }
  }, [isAuthenticated, navigate]);

  const fetchLeads = useCallback(async () => {
    const agentId =
      agentIdOverride ||
      localStorage.getItem("agent_id") ||
      localStorage.getItem("agentId");

    if (!agentId) {
      setError("Agent ID not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dateRangeField = (filters.date_range_field as string) || null;
      const dateRange: [string | null, string | null] =
        Array.isArray(filters.date_range) && filters.date_range.length === 2
          ? [
              filters.date_range[0] as string | null,
              filters.date_range[1] as string | null,
            ]
          : [null, null];

      const createdAtRange: [string | null, string | null] =
        dateRangeField === "created_at" ? dateRange : [null, null];
      const updatedAtRange: [string | null, string | null] =
        dateRangeField === "updated_at" ? dateRange : [null, null];

      const sortByValue: { [key: string]: 1 | -1 } | undefined = sortBy
        ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
        : undefined;

      const searchTypeValue:
        | "number"
        | "name"
        | "id"
        | "email"
        | "agent_name"
        | undefined = filters.search_type
        ? (filters.search_type as
            | "number"
            | "name"
            | "id"
            | "email"
            | "agent_name")
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
        setTotal(
          response.pagination_metadata?.total_records ||
            response.response.length
        );
      } else {
        setError(response.message || "Failed to fetch leads");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters, agentIdOverride]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated, fetchLeads, agentIdOverride]);

  const handleSort = (key: string, order: "asc" | "desc") => {
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
      date_range_field: null,
      date_range: null,
      search_text: "",
      search_type: null,
    });
    setPage(1);
  };

  const handleExportToExcel = () => {
    if (leads.length === 0) return;
    const exportColumns: ExportColumn<UserLead>[] = allColumns.map((col) => {
      if (!col.render) return { key: col.key, label: col.label };
      return {
        key: col.key,
        label: col.label,
        render: (value: unknown, row: UserLead) => {
          const rawValue = (row as unknown as Record<string, unknown>)[col.key];
          if (col.key === "name") {
            const name = [row.fname, row.mname, row.lname]
              .filter(Boolean)
              .join(" ");
            return name || "-";
          }
          if (col.key === "application_status" || col.key === "loan_status")
            return String(rawValue || "-");
          if (col.key === "income") return rawValue ? Number(rawValue) : 0;
          if (
            col.key.includes("_date") ||
            col.key.includes("created_at") ||
            col.key.includes("updated_at")
          ) {
            if (!rawValue) return "-";
            try {
              return new Date(rawValue as string).toLocaleString();
            } catch {
              return String(rawValue);
            }
          }
          if (rawValue === null || rawValue === undefined) return "-";
          return String(rawValue);
        },
      };
    });
    exportToExcel(
      leads as unknown as Record<string, unknown>[],
      exportColumns as unknown as ExportColumn<Record<string, unknown>>[],
      "leads"
    );
  };

  const handleCreateLead = (type: "allLenders" | "muthootEDI") => {
    const agentId =
      agentIdOverride ||
      localStorage.getItem("agent_id") ||
      localStorage.getItem("agentId") ||
      "";
    const mobNum = agentMobNum || localStorage.getItem("agentMobNum") || "";
    if (!agentId) {
      alert("Agent ID not found");
      return;
    }
    const encodedMobNum = mobNum ? btoa(String(mobNum).trim()) : "";
    let url = "";
    if (type === "allLenders") {
      url = `https://login.clickpe.ai/login?agentId=${agentId}${
        encodedMobNum ? `&m=${encodedMobNum}` : ""
      }`;
    } else {
      url = `https://muthoot.clickpe.ai/?agentId=${agentId}${
        encodedMobNum ? `&m=${encodedMobNum}` : ""
      }`;
    }
    window.open(url, "_blank");
    setShowCreateLeadMenu(false);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "search_type",
      label: "Search Type",
      type: "select",
      options: SEARCH_TYPE_OPTIONS,
    },
    {
      key: "search_text",
      label: "Search",
      type: "text",
      placeholder: "Enter search text...",
    },
    {
      key: "loan_status",
      label: "Loan Status",
      type: "select",
      options: LOAN_STATUS_OPTIONS,
    },
    {
      key: "date_range",
      label: "Date Range",
      type: "dateRangeField",
      dateRangeFields: [
        { label: "Created At", value: "created_at" },
        { label: "Updated At", value: "updated_at" },
      ],
    },
  ];

  const columns: Column<UserLead>[] = [
    { key: "user_id", label: "User ID", sortable: true, defaultVisible: true },
    {
      key: "name",
      label: "Name",
      sortable: true,
      defaultVisible: true,
      render: (_, row) =>
        [row.fname, row.mname, row.lname].filter(Boolean).join(" ") || "-",
    },
    { key: "mob_num", label: "Mobile", sortable: true, defaultVisible: true },
    { key: "email", label: "Email", sortable: true, defaultVisible: true },
    {
      key: "application_status",
      label: "Status",
      sortable: true,
      defaultVisible: true,
      render: (value) => (
        <span
          style={{
            color:
              {
                APPROVED: "#10b981",
                PENDING: "#f59e0b",
                REJECTED: "#ef4444",
                UNDER_REVIEW: "#3b82f6",
              }[String(value || "")] || "#6b7280",
            fontWeight: 500,
          }}
        >
          {String(value || "")}
        </span>
      ),
    },
    {
      key: "agent_name",
      label: "Agent Name",
      sortable: true,
      defaultVisible: true,
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      defaultVisible: true,
      render: (value) => {
        try {
          return value ? new Date(value as string).toLocaleDateString() : "-";
        } catch {
          return String(value);
        }
      },
    },
    {
      key: "updated_at",
      label: "Updated At",
      sortable: true,
      defaultVisible: false,
      render: (value) => {
        try {
          return value ? new Date(value as string).toLocaleDateString() : "-";
        } catch {
          return String(value);
        }
      },
    },
    {
      key: "income",
      label: "Income",
      sortable: true,
      defaultVisible: false,
      render: (value) => (value ? `₹${Number(value).toLocaleString()}` : "-"),
    },
    {
      key: "occupation",
      label: "Occupation",
      sortable: true,
      defaultVisible: false,
    },
  ];

  const dynamicColumns = useMemo(() => {
    if (leads.length === 0) return [];
    const allKeys = Object.keys(leads[0] || {}) as (keyof UserLead)[];
    const definedKeys = new Set(columns.map((col) => col.key));
    const remainingKeys = allKeys.filter(
      (key) => !definedKeys.has(String(key))
    );
    return remainingKeys.map((key) => {
      const label = String(key)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      let render:
        | ((value: unknown, row: UserLead) => React.ReactNode)
        | undefined;
      if (
        key.toString().includes("_amt") ||
        key.toString().includes("amount") ||
        key === "income"
      )
        render = (value) =>
          value ? `₹${Number(value).toLocaleString()}` : "-";
      else if (
        key.toString().includes("_date") ||
        key.toString().includes("created_at") ||
        key.toString().includes("updated_at") ||
        key === "dob"
      )
        render = (value) => {
          try {
            return value ? new Date(value as string).toLocaleDateString() : "-";
          } catch {
            return String(value);
          }
        };
      else if (key === "is_politically_exposed")
        render = (value) =>
          value === null || value === undefined ? "-" : value ? "Yes" : "No";
      else
        render = (value) =>
          value === null || value === undefined ? "-" : String(value);
      return {
        key: String(key),
        label,
        sortable: true,
        defaultVisible: false,
        render,
      } as Column<UserLead>;
    });
  }, [leads]);

  const allColumns = useMemo(
    () => [...columns, ...dynamicColumns],
    [columns, dynamicColumns]
  );

  const statusColors: Record<string, string> = {
    APPROVED: "#10b981",
    PENDING: "#f59e0b",
    REJECTED: "#ef4444",
    UNDER_REVIEW: "#3b82f6",
    KYC_SUCCESS: "#10b981",
    KYC_REJECTED: "#ef4444",
  };

  const mockLeadCounts = useMemo(
    () => [
      {
        title: "Loan Status",
        items: LOAN_STATUS_OPTIONS.map((opt) => ({
          label: opt.label,
          count: Math.floor(Math.random() * 50) + 1,
          color: statusColors[opt.value] || "#6b7280",
        })),
      },
    ],
    []
  );

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Leads
              {agentName && (
                <span className={styles.agentContext}>({agentName})</span>
              )}
            </h1>
            {agentName && (
              <p className={styles.agentContextInfo}>
                Viewing leads for: {agentName} (ID: {agentIdOverride})
              </p>
            )}
          </div>
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
                      onClick={() => handleCreateLead("allLenders")}
                    >
                      All lenders
                    </button>
                    <button
                      className={styles.menuItem}
                      onClick={() => handleCreateLead("muthootEDI")}
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
          statusCounts={mockLeadCounts}
        />
        <DataTable
          data={leads}
          columns={allColumns}
          loading={loading}
          tableId="leads"
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
          sorting={{ sortBy, sortOrder, onSort: handleSort }}
          onRowClick={(row) => {
            const params = new URLSearchParams();
            if (agentIdOverride) params.set("agentId", agentIdOverride);
            if (agentName) params.set("agentName", agentName);
            if (agentMobNum) params.set("agentMobNum", agentMobNum);
            if (agentEmail) params.set("agentEmail", agentEmail);
            const queryString = params.toString();
            navigate(
              `/customer/${row.user_id}${queryString ? `?${queryString}` : ""}`,
              { state: { lead: row } }
            );
          }}
          emptyMessage="No leads found"
        />
      </div>
    </MainLayout>
  );
};
