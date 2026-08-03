/* eslint-disable react-hooks/refs */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const adminToken = sessionStorage.getItem('yeog_admin_token');
    socket.current = io(SOCKET_URL, {
      auth: { token: adminToken },
    });

    socket.current.on('connect', () => {
      setIsConnected(true);
      socket.current.emit('join_admin');
    });

    socket.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const value = useMemo(
    () => ({ socket: socket.current, isConnected }),
    [isConnected]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
