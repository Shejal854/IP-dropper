/**
 * Central config — all magic numbers and environment values live here.
 * Import this instead of hardcoding values across the codebase.
 */

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const TRANSFER = {
  CHUNK_SIZE: 64 * 1024,        // 64 KB per chunk
  BUFFER_THRESHOLD: 16 * 1024 * 1024, // pause sending if buffer > 16 MB
  HISTORY_LIMIT: 50,            // max entries kept in transfer history
};
