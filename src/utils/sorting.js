/**
 * Sort an array of items by a specified field
 * @param {Array} array - Items to sort
 * @param {String} sortBy - Field to sort by (e.g., 'name', 'price', 'stock', 'createdAt')
 * @param {String} sortOrder - 'asc' for ascending, 'desc' for descending
 * @returns {Array} - New sorted array
 */
export const sortData = (array, sortBy, sortOrder = 'asc') => {
  if (!sortBy) return array;

  const sorted = [...array].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    // Handle nested properties if needed (e.g., 'category.name')
    if (sortBy.includes('.')) {
      const keys = sortBy.split('.');
      aVal = keys.reduce((obj, key) => obj?.[key], a);
      bVal = keys.reduce((obj, key) => obj?.[key], b);
    }

    // Handle different data types
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Get sort icon for a column header
 * @param {String} column - Current column
 * @param {String} activeSortBy - Active sort column
 * @param {String} sortOrder - Current sort order
 * @returns {String} - Icon character (↑ or ↓)
 */
export const getSortIcon = (column, activeSortBy, sortOrder) => {
  if (column !== activeSortBy) return null;
  return sortOrder === 'asc' ? ' ↑' : ' ↓';
};
