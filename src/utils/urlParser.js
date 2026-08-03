/**
 * Parse table-related URL search parameters.
 * Expected format: ?table=3&status=active
 *
 * @param {string} searchString - e.g. "?table=3&status=active"
 * @returns {{ table: string|null, status: string|null }}
 */
export function parseTableParams(searchString) {
  const params = new URLSearchParams(searchString);
  return {
    table: params.get('table'),
    status: params.get('status'),
  };
}

/**
 * Validate that the table access parameters are correct.
 * - `table` must exist and be a positive integer
 * - `status` must be strictly "active"
 *
 * @param {{ table: string|null, status: string|null }} params
 * @returns {{ valid: boolean, error?: string, tableNumber?: number }}
 */
export function isValidTableAccess(params) {
  if (!params.table) {
    return {
      valid: false,
      error: 'No table number found. Please scan the QR code at your table to place an order.',
    };
  }

  const tableNum = parseInt(params.table, 10);
  if (isNaN(tableNum) || tableNum <= 0) {
    return {
      valid: false,
      error: 'Invalid table number. Please scan a valid QR code.',
    };
  }

  if (!params.status) {
    return {
      valid: false,
      error: 'Table status not found. Please scan the QR code at your table.',
    };
  }

  if (params.status !== 'active') {
    return {
      valid: false,
      error: `This table is currently "${params.status}". Please ask a staff member for assistance.`,
    };
  }

  return {
    valid: true,
    tableNumber: tableNum,
  };
}
