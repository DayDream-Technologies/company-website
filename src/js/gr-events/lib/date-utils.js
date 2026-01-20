/**
 * GR Events Calendar - Date Utilities
 * Lightweight date formatting without external dependencies
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse an ISO date string
 * @param {string} dateStr - ISO date string (YYYY-MM-DD or full ISO datetime)
 * @returns {Date}
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // Handle YYYY-MM-DD format
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  return new Date(dateStr);
}

/**
 * Format date as "Mon, Jan 1, 2024"
 */
function formatShortDate(date) {
  if (typeof date === 'string') date = parseDate(date);
  
  const day = DAYS_SHORT[date.getDay()];
  const month = MONTHS_SHORT[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();
  
  return `${day}, ${month} ${dayNum}, ${year}`;
}

/**
 * Format date as "Monday, January 1, 2024"
 */
function formatLongDate(date) {
  if (typeof date === 'string') date = parseDate(date);
  
  const day = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();
  
  return `${day}, ${month} ${dayNum}, ${year}`;
}

/**
 * Format date as "Jan 1"
 */
function formatMonthDay(date) {
  if (typeof date === 'string') date = parseDate(date);
  
  const month = MONTHS_SHORT[date.getMonth()];
  const dayNum = date.getDate();
  
  return `${month} ${dayNum}`;
}

/**
 * Format date as "Jan 1, 2024"
 */
function formatMediumDate(date) {
  if (typeof date === 'string') date = parseDate(date);
  
  const month = MONTHS_SHORT[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${dayNum}, ${year}`;
}

/**
 * Get month abbreviation
 */
function getMonthAbbr(date) {
  if (typeof date === 'string') date = parseDate(date);
  return MONTHS_SHORT[date.getMonth()];
}

/**
 * Get day of month
 */
function getDayOfMonth(date) {
  if (typeof date === 'string') date = parseDate(date);
  return date.getDate();
}

/**
 * Check if date is before today
 */
function isPast(date) {
  if (typeof date === 'string') date = parseDate(date);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * Format relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Format for ICS file (YYYYMMDDTHHMMSS)
 */
function formatICSDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Format for Google Calendar URL
 */
function formatGoogleDate(dateStr) {
  return formatICSDate(dateStr).replace(/T/g, '');
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.DateUtils = {
  parseDate,
  formatShortDate,
  formatLongDate,
  formatMonthDay,
  formatMediumDate,
  getMonthAbbr,
  getDayOfMonth,
  isPast,
  formatRelativeTime,
  formatICSDate,
  formatGoogleDate,
};
