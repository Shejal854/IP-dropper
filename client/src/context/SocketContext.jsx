import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../utils/socket';

/**
 * SocketContext
 *
 * Provides the socket instance and connection status to the entire app.
 * Any component can call useSocket() instead of importing getSocket() directly.
 */
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Sync with current state in case socket was already connected
    setConnected(socket.connected);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to consume the socket context.
 * Must be used inside <SocketProvider>.
 */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
