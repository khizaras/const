/**
 * CSV Export Utility
 * Converts data to CSV format for exports
 */

/**
 * Convert an array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Array of column definitions: { key, label }
 * @returns {string} CSV string
 */
function arrayToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  // Extract headers
  const headers = columns.map((col) => escapeCSVField(col.label)).join(',');

  // Extract rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = getNestedValue(row, col.key);
        return escapeCSVField(value);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Escape a field for CSV format
 * @param {any} field - Field value to escape
 * @returns {string} Escaped field
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, newline, or double quote, wrap in quotes and escape internal quotes
  if (
    stringField.includes(',') ||
    stringField.includes('\n') ||
    stringField.includes('"')
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {any} Value at path
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Set CSV response headers
 * @param {Response} res - Express response object
 * @param {string} filename - Filename for download
 */
function setCSVHeaders(res, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache');
}

module.exports = {
  arrayToCSV,
  escapeCSVField,
  getNestedValue,
  setCSVHeaders,
};
