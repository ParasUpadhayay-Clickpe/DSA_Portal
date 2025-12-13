import React, { useState, useMemo } from 'react';
import { Skeleton } from './Skeleton';
import styles from './DataTable.module.css';

export interface Column<T> {
    key: string;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    sortable?: boolean;
    defaultVisible?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    tableId?: string; // Unique identifier for saving/loading configuration
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    };
    sorting?: {
        sortBy: string | null;
        sortOrder: 'asc' | 'desc' | null;
        onSort: (key: string, order: 'asc' | 'desc') => void;
    };
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, any> = Record<string, unknown>>({
    data,
    columns,
    loading = false,
    tableId,
    pagination,
    sorting,
    onRowClick,
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    // Load saved configuration from localStorage
    const loadSavedConfig = (): { visibleColumns: Set<string>; columnOrder: string[] } | null => {
        if (!tableId) return null;
        try {
            const saved = localStorage.getItem(`table_config_${tableId}`);
            if (saved) {
                const config = JSON.parse(saved);
                return {
                    visibleColumns: new Set(config.visibleColumns || []),
                    columnOrder: config.columnOrder || columns.map((col) => col.key),
                };
            }
        } catch (err) {
            console.error('Failed to load saved table configuration:', err);
        }
        return null;
    };

    const savedConfig = loadSavedConfig();
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
        if (savedConfig) {
            // Validate saved columns against current columns
            const validColumns = new Set(columns.map((col) => col.key));
            const savedVisible = new Set(
                Array.from(savedConfig.visibleColumns).filter((key) => validColumns.has(key))
            );
            // If no valid saved columns, fall back to defaults
            if (savedVisible.size === 0) {
                return new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.key));
            }
            return savedVisible;
        }
        return new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.key));
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        if (savedConfig) {
            // Validate saved order against current columns
            const validColumns = new Set(columns.map((col) => col.key));
            const savedOrder = savedConfig.columnOrder.filter((key) => validColumns.has(key));
            // Add any new columns that weren't in saved config
            const newColumns = columns
                .map((col) => col.key)
                .filter((key) => !savedOrder.includes(key));
            return [...savedOrder, ...newColumns];
        }
        return columns.map((col) => col.key);
    });
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [columnSearchQuery, setColumnSearchQuery] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Save configuration to localStorage
    const saveConfiguration = () => {
        if (!tableId) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
            return;
        }

        setSaveStatus('saving');
        try {
            const config = {
                visibleColumns: Array.from(visibleColumns),
                columnOrder: columnOrder,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(`table_config_${tableId}`, JSON.stringify(config));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to save table configuration:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const visibleColumnsList = useMemo(() => {
        const visible = columns.filter((col) => visibleColumns.has(col.key));
        // Sort by columnOrder, maintaining original order for columns not in order
        return visible.sort((a, b) => {
            const indexA = columnOrder.indexOf(a.key);
            const indexB = columnOrder.indexOf(b.key);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }, [columns, visibleColumns, columnOrder]);

    const toggleColumn = (key: string) => {
        setVisibleColumns((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
                // Add to column order if not already present
                if (!columnOrder.includes(key)) {
                    setColumnOrder((prevOrder) => [...prevOrder, key]);
                }
            }
            return next;
        });
    };

    const handleSort = (key: string) => {
        if (!sorting) return;
        const column = columns.find((col) => col.key === key);
        if (!column?.sortable) return;

        if (sorting.sortBy === key) {
            if (sorting.sortOrder === 'asc') {
                sorting.onSort(key, 'desc');
            } else {
                sorting.onSort(key, 'asc');
            }
        } else {
            sorting.onSort(key, 'asc');
        }
    };

    const getSortIcon = (key: string) => {
        if (!sorting || sorting.sortBy !== key) {
            return '↕';
        }
        return sorting.sortOrder === 'asc' ? '↑' : '↓';
    };

    const handleDragStart = (key: string) => {
        setDraggedColumn(key);
    };

    const handleDragOver = (e: React.DragEvent, key: string) => {
        e.preventDefault();
        if (draggedColumn && draggedColumn !== key) {
            setDragOverColumn(key);
        }
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetKey: string) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetKey) {
            setDraggedColumn(null);
            setDragOverColumn(null);
            return;
        }

        const newOrder = [...columnOrder];
        const draggedIndex = newOrder.indexOf(draggedColumn);
        const targetIndex = newOrder.indexOf(targetKey);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged column from its position
            newOrder.splice(draggedIndex, 1);
            // Insert at target position
            newOrder.splice(targetIndex, 0, draggedColumn);
            setColumnOrder(newOrder);
        }

        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    return (
        <div className={styles.dataTableContainer}>
            <div className={styles.tableHeader}>
                {pagination && (
                    <div className={styles.paginationInfo}>
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} entries
                    </div>
                )}
                <div className={styles.tableControls}>
                    {sorting && sorting.sortBy && (
                        <button className={styles.sortButton}>
                            ↑↓ Sort {sorting.sortOrder === 'asc' ? '↑' : '↓'} 1
                        </button>
                    )}
                    {tableId && (
                        <button
                            className={styles.saveConfigButton}
                            onClick={saveConfiguration}
                            disabled={saveStatus === 'saving'}
                            title="Save current column configuration"
                        >
                            {saveStatus === 'saving'
                                ? 'Saving...'
                                : saveStatus === 'saved'
                                    ? '✓ Saved'
                                    : saveStatus === 'error'
                                        ? '✗ Error'
                                        : 'Save Configuration'}
                        </button>
                    )}
                    <div className={styles.viewMenuContainer}>
                        <button
                            className={styles.viewButton}
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                        >
                            View
                        </button>
                        {showColumnMenu && (
                            <>
                                <div
                                    className={styles.menuOverlay}
                                    onClick={() => setShowColumnMenu(false)}
                                />
                                <div className={styles.viewMenu}>
                                    <input
                                        type="text"
                                        placeholder="Search columns..."
                                        className={styles.columnSearch}
                                        value={columnSearchQuery}
                                        onChange={(e) => setColumnSearchQuery(e.target.value)}
                                    />
                                    <div className={styles.columnList}>
                                        {columns
                                            .filter((column) => {
                                                if (!columnSearchQuery.trim()) return true;
                                                const query = columnSearchQuery.toLowerCase();
                                                return (
                                                    column.label.toLowerCase().includes(query) ||
                                                    column.key.toLowerCase().includes(query)
                                                );
                                            })
                                            .map((column) => (
                                                <label
                                                    key={column.key}
                                                    className={styles.columnItem}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.has(column.key)}
                                                        onChange={() => toggleColumn(column.key)}
                                                    />
                                                    <span>{column.label}</span>
                                                </label>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {visibleColumnsList.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${styles.th} ${column.sortable ? styles.sortable : ''} ${draggedColumn === column.key ? styles.dragging : ''
                                        } ${dragOverColumn === column.key ? styles.dragOver : ''
                                        }`}
                                    draggable
                                    onDragStart={() => handleDragStart(column.key)}
                                    onDragOver={(e) => handleDragOver(e, column.key)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.key)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => {
                                        // Only sort if not dragging
                                        if (!draggedColumn && column.sortable) {
                                            handleSort(column.key);
                                        }
                                    }}
                                >
                                    <div className={styles.thContent}>
                                        <span
                                            className={styles.dragHandle}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            ⋮⋮
                                        </span>
                                        <span className={styles.columnLabel}>{column.label}</span>
                                        {column.sortable && (
                                            <span
                                                className={styles.sortIcon}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!draggedColumn) {
                                                        handleSort(column.key);
                                                    }
                                                }}
                                            >
                                                {getSortIcon(column.key)}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                    <tr key={i} className={styles.skeletonRow}>
                                        {visibleColumnsList.map((column) => (
                                            <td key={column.key} className={styles.skeletonCell}>
                                                <Skeleton
                                                    className={styles.skeletonText}
                                                    style={{
                                                        width: i % 3 === 0 ? '80%' : i % 2 === 0 ? '90%' : '100%',
                                                        height: '20px',
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={visibleColumnsList.length}
                                    className={styles.emptyCell}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={index}
                                    className={onRowClick ? styles.clickableRow : ''}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {visibleColumnsList.map((column) => (
                                        <td key={column.key} className={styles.td}>
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : String(row[column.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className={styles.pagination}>
                    <button
                        className={styles.paginationButton}
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Previous
                    </button>
                    <span className={styles.paginationInfo}>
                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                    </span>
                    <button
                        className={styles.paginationButton}
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        disabled={
                            pagination.page >= Math.ceil(pagination.total / pagination.pageSize)
                        }
                    >
                        Next
                    </button>
                    <select
                        className={styles.pageSizeSelect}
                        value={pagination.pageSize}
                        onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                    >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>
            )}
        </div>
    );
}

