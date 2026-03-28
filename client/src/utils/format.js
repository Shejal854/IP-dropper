/**
 * Pure formatting helpers — no side effects, easy to unit test.
 */

/**
 * Converts bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}  e.g. "4.2 MB", "312 KB", "800 B"
 */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024)        return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Formats a Unix timestamp as a short time string.
 * @param {number} timestamp
 * @returns {string}  e.g. "02:45 PM"
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Extracts a file extension label (up to 4 chars, uppercased).
 * @param {string} filename
 * @returns {string}  e.g. "PDF", "MP4", "FILE"
 */
export function getFileExtLabel(filename) {
  const ext = filename.split('.').pop();
  return ext ? ext.toUpperCase().slice(0, 4) : 'FILE';
}
