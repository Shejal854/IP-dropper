import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';

/**
 * Singleton socket instance.
 * Ensures only one connection is created regardless of how many
 * components call getSocket().
 */
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
