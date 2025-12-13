/**
 * Utility function to export data to Excel format
 */

import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
    key: string;
    label: string;
    render?: (value: unknown, row: T) => string | number;
}

/**
 * Export data to Excel file
 * @param data - Array of data objects to export
 * @param columns - Column definitions with labels and optional render functions
 * @param filename - Name of the Excel file (without extension)
 */
export function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[],
    filename: string = 'export'
): void {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Prepare worksheet data
    const worksheetData = data.map((row) => {
        const rowData: Record<string, string | number> = {};
        columns.forEach((column) => {
            const value = row[column.key];
            let cellValue: string | number = '';

            if (column.render) {
                // Use custom render function
                const rendered = column.render(value, row);
                // Handle different render return types
                if (typeof rendered === 'string' || typeof rendered === 'number') {
                    cellValue = rendered;
                } else if (rendered === null || rendered === undefined) {
                    cellValue = '';
                } else {
                    // For React nodes or complex objects, convert to string
                    cellValue = String(rendered);
                }
            } else {
                // Default rendering
                if (value === null || value === undefined) {
                    cellValue = '';
                } else if (typeof value === 'number') {
                    cellValue = value;
                } else if (typeof value === 'boolean') {
                    cellValue = value ? 'Yes' : 'No';
                } else if (value instanceof Date) {
                    cellValue = value.toLocaleString();
                } else {
                    cellValue = String(value);
                }
            }

            rowData[column.label] = cellValue;
        });
        return rowData;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = columns.map((col) => ({
        wch: Math.min(Math.max(col.label.length, 10), maxWidth),
    }));
    worksheet['!cols'] = colWidths;

    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

