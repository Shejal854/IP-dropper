import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { TRANSFER } from '../config';

export function useDevices() {
  const { socket } = useSocket();
  const [myDevice, setMyDevice]     = useState(null);
  const [allDevices, setAllDevices]   = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    socket.on('registered', (device) => {
      setMyDevice(device);
      setIsRegistered(true);
    });

    socket.on('devices', (list) => {
      setAllDevices(list);
    });

    return () => {
      socket.off('registered');
      socket.off('devices');
    };
  }, [socket]);

  const register = useCallback((name) => {
    if (!name.trim()) return;
    socket.emit('register', { name: name.trim() });
  }, [socket]);

  const peers = allDevices.filter((d) => d.id !== myDevice?.id);

  return { myDevice, peers, register, isRegistered };
}

export function useTransferHistory() {
  const [history, setHistory] = useState([]);

  const addToHistory = useCallback((entry) => {
    setHistory((prev) => [entry, ...prev].slice(0, TRANSFER.HISTORY_LIMIT));
  }, []);

  return { history, addToHistory };
}
