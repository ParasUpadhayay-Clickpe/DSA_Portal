import React, { useState, useRef, useEffect } from 'react';
import styles from './FilterPanel.module.css';

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'multiSelect' | 'searchableSelect' | 'date' | 'dateRange' | 'dateRangeField' | 'text' | 'numberRange';
    options?: FilterOption[];
    placeholder?: string;
    dateRangeFields?: FilterOption[]; // For dateRangeField type - options for which field to filter
    minPlaceholder?: string; // For numberRange
    maxPlaceholder?: string; // For numberRange
}

export interface FilterPanelProps {
    filters: FilterConfig[];
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    onReset: () => void;
}

// Searchable Select Component
function SearchableSelect({
    options,
    value,
    onChange,
    placeholder
}: {
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.searchableSelect} ref={containerRef}>
            <div
                className={styles.searchableSelectTrigger}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? '' : styles.placeholder}>
                    {selectedOption?.label || placeholder || 'Select...'}
                </span>
                <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <div className={styles.searchableSelectDropdown}>
                    <input
                        type="text"
                        className={styles.searchableSelectSearch}
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                    <div className={styles.searchableSelectOptions}>
                        <div
                            className={`${styles.searchableSelectOption} ${!value ? styles.selected : ''}`}
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                        >
                            All
                        </div>
                        {filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`${styles.searchableSelectOption} ${opt.value === value ? styles.selected : ''}`}
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                            >
                                {opt.label}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className={styles.searchableSelectNoResults}>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function FilterPanel({ filters, values, onChange, onReset }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(true);

    const handleFilterChange = (key: string, value: unknown) => {
        onChange(key, value);
    };

    const activeFiltersCount = Object.entries(values).filter(([key, v]) => {
        // Don't count field selectors as separate filters
        if (key.endsWith('_field')) return false;
        return v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 && v.some(item => item !== null) : true);
    }).length;

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
                                {filter.type === 'multiSelect' && (
                                    <div className={styles.multiSelect}>
                                        <div className={styles.multiSelectTags}>
                                            {Array.isArray(values[filter.key]) && (values[filter.key] as string[]).map((val) => {
                                                const option = filter.options?.find(o => o.value === val);
                                                return (
                                                    <span key={val} className={styles.multiSelectTag}>
                                                        {option?.label || val}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const current = values[filter.key] as string[];
                                                                handleFilterChange(filter.key, current.filter(v => v !== val));
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <select
                                            className={styles.filterInput}
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const current = Array.isArray(values[filter.key]) ? values[filter.key] as string[] : [];
                                                    if (!current.includes(e.target.value)) {
                                                        handleFilterChange(filter.key, [...current, e.target.value]);
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">Select...</option>
                                            {filter.options?.filter(opt => {
                                                const current = Array.isArray(values[filter.key]) ? values[filter.key] as string[] : [];
                                                return opt.value !== null && !current.includes(opt.value);
                                            }).map((option) => (
                                                <option key={option.value} value={option.value || ''}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {filter.type === 'searchableSelect' && (
                                    <SearchableSelect
                                        options={filter.options || []}
                                        value={(values[filter.key] as string) || ''}
                                        onChange={(val) => handleFilterChange(filter.key, val || null)}
                                        placeholder={filter.placeholder}
                                    />
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
                                {filter.type === 'dateRangeField' && (
                                    <div className={styles.dateRangeField}>
                                        <select
                                            className={styles.filterInput}
                                            value={(values[`${filter.key}_field`] as string) || ''}
                                            onChange={(e) => {
                                                handleFilterChange(`${filter.key}_field`, e.target.value || null);
                                                // Reset date range when field changes
                                                if (!e.target.value) {
                                                    handleFilterChange(filter.key, null);
                                                }
                                            }}
                                        >
                                            <option value="">Select field...</option>
                                            {filter.dateRangeFields?.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {(values[`${filter.key}_field`] as string) && (
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
                                )}
                                {filter.type === 'numberRange' && (
                                    <div className={styles.dateRange}>
                                        <input
                                            type="number"
                                            className={styles.filterInput}
                                            placeholder={filter.minPlaceholder || 'Min'}
                                            value={
                                                Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as (number | null)[])[0] ?? ''
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                const current = Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as (number | null)[])
                                                    : [null, null];
                                                handleFilterChange(filter.key, [
                                                    e.target.value ? Number(e.target.value) : null,
                                                    current[1],
                                                ]);
                                            }}
                                        />
                                        <span>to</span>
                                        <input
                                            type="number"
                                            className={styles.filterInput}
                                            placeholder={filter.maxPlaceholder || 'Max'}
                                            value={
                                                Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as (number | null)[])[1] ?? ''
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                const current = Array.isArray(values[filter.key])
                                                    ? (values[filter.key] as (number | null)[])
                                                    : [null, null];
                                                handleFilterChange(filter.key, [
                                                    current[0],
                                                    e.target.value ? Number(e.target.value) : null,
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

