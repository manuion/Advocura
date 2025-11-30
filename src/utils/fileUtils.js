/**
 * File Utility Functions
 * Helper functions for file operations and formatting
 */

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} - File extension (e.g., "pdf", "jpg")
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Check if file is an image
 * @param {string} filename - File name
 * @returns {boolean}
 */
export const isImage = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
};

/**
 * Check if file is a PDF
 * @param {string} filename - File name
 * @returns {boolean}
 */
export const isPDF = (filename) => {
  return getFileExtension(filename) === 'pdf';
};

/**
 * Check if file is a document (Office formats)
 * @param {string} filename - File name
 * @returns {boolean}
 */
export const isDocument = (filename) => {
  const docExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const ext = getFileExtension(filename);
  return docExtensions.includes(ext);
};

/**
 * Sanitize filename for safe file system storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'unnamed';
  // Remove or replace unsafe characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original file name
 * @returns {string} - Unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalName);
  return `${timestamp}_${sanitized}`;
};
