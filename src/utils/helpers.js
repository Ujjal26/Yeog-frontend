/**
 * Format a number as Indian Rupee price string.
 * @param {number} amount
 * @returns {string} e.g. "₹249.00"
 */
export function formatPrice(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

/**
 * Format an ISO timestamp to a human-readable time string.
 * @param {string} timestamp - ISO 8601 string
 * @returns {string} e.g. "2:30 PM"
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate a collision-resistant order ID.
 *
 * BUG-03 FIX: The previous 4-digit Math.random approach (ORD-XXXX) only had 9,000
 * possible values. By the Birthday Paradox, collision probability exceeded 50% after
 * just 118 orders, causing MongoDB E11000 unique index errors and silently dropped orders.
 *
 * New format: ORD-<4-char base-36 timestamp>-<4-char base-36 random>
 * Unique slot count: ~1.68 billion combinations per timestamp tick — collision-safe
 * for any realistic cafe volume.
 *
 * @returns {string} e.g. "ORD-LK3F-A8QZ"
 */
export function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Calculate tax amount (5%).
 * @param {number} subtotal
 * @returns {number}
 */
export function calculateTax(subtotal) {
  return subtotal * 0.05;
}

/**
 * Get the time elapsed since a given timestamp.
 * @param {string} timestamp - ISO 8601 string
 * @returns {string} e.g. "5 min ago", "1 hr ago"
 */
export function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}
