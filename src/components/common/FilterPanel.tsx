import React, { useState } from 'react';
import styles from './FilterPanel.module.css';

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'date' | 'dateRange' | 'text';
    options?: FilterOption[];
    placeholder?: string;
}

export interface FilterPanelProps {
    filters: FilterConfig[];
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    onReset: () => void;
}

export function FilterPanel({ filters, values, onChange, onReset }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleFilterChange = (key: string, value: unknown) => {
        onChange(key, value);
    };

    const activeFiltersCount = Object.values(values).filter(
        (v) => v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
    ).length;

    return (
        <div className={styles.filterPanel}>
            <div className={styles.filterHeader}>
                <button
                    className={styles.filterButton}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>Advanced filters</span>
                    {activeFiltersCount > 0 && (
                        <span className={styles.badge}>{activeFiltersCount}</span>
                    )}
                </button>
                <button className={styles.commandButton}>
                    <span>Command filters</span>
                </button>
                {activeFiltersCount > 0 && (
                    <button className={styles.resetButton} onClick={onReset}>
                        Reset
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={styles.filterContent}>
                    <div className={styles.filterGrid}>
                        {filters.map((filter) => (
                            <div key={filter.key} className={styles.filterItem}>
                                <label className={styles.filterLabel}>{filter.label}</label>
                                {filter.type === 'select' && (
                                    <select
                                        className={styles.filterInput}
                                        value={
                                            Array.isArray(values[filter.key])
                                                ? ''
                                                : (values[filter.key] as string) || ''
                                        }
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleFilterChange(filter.key, e.target.value);
                                            } else {
                                                handleFilterChange(filter.key, null);
                                            }
                                        }}
                                    >
                                        <option value="">All</option>
                                        {filter.options?.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {filter.type === 'text' && (
                                    <input
                                        type="text"
                                        className={styles.filterInput}
                                        placeholder={filter.placeholder}
                                        value={(values[filter.key] as string) || ''}
                                        onChange={(e) =>
                                            handleFilterChange(filter.key, e.target.value || null)
                                        }
                                    />
                                )}
                                {filter.type === 'date' && (
                                    <input
                                        type="date"
                                        className={styles.filterInput}
                                        value={(values[filter.key] as string) || ''}
                                        onChange={(e) =>
                                            handleFilterChange(filter.key, e.target.value || null)
                                        }
                                    />
                                )}
                                {filter.type === 'dateRange' && (
                                    <div className={styles.dateRange}>
                                        <input
                                            type="date"
                                            className={styles.filterInput}
                                            value={
                                                Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as string[])[0] || ''
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                const current = Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as string[])
                                                    : [null, null];
                                                handleFilterChange(filter.key, [
                                                    e.target.value || null,
                                                    current[1],
                                                ]);
                                            }}
                                        />
                                        <span>to</span>
                                        <input
                                            type="date"
                                            className={styles.filterInput}
                                            value={
                                                Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as string[])[1] || ''
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                const current = Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as string[])
                                                    : [null, null];
                                                handleFilterChange(filter.key, [
                                                    current[0],
                                                    e.target.value || null,
                                                ]);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

