export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const TRANSFER = {
  CHUNK_SIZE: 64 * 1024,        
  BUFFER_THRESHOLD: 16 * 1024 * 1024, 
  HISTORY_LIMIT: 50,            
};
