/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useCart } from './CartContext';
import { useOrders } from './OrderContext';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const TableSocketContext = createContext(null);

export function TableSocketProvider({ children }) {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { tableNumber, clearCart } = useCart();
  const { updateOrderStatus } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (tableNumber) {
      if (!socket.current) {
        const token = sessionStorage.getItem('yeog_customer_token');
        socket.current = io(SOCKET_URL, {
          auth: { token },
          query: { table: tableNumber },
        });

        socket.current.on('connect', () => {
          setIsConnected(true);
          socket.current.emit('join_table', tableNumber);
        });

        socket.current.on('disconnect', () => {
          setIsConnected(false);
        });

        // Admin closed this table (payment done)
        socket.current.on('table_closed', () => {
          clearCart();
          socket.current.disconnect();
          socket.current = null;
          navigate('/');
        });

        // Admin updated order status
        socket.current.on('order_status_updated', ({ orderId, status }) => {
          updateOrderStatus(orderId, status);
        });
      }
    } else {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        setIsConnected(false);
      }
    }

    return () => {
      // Don't disconnect here on unmount so the connection persists across route changes
    };
  }, [tableNumber, clearCart, navigate, updateOrderStatus]);

  const value = useMemo(
    () => ({ socket: socket.current, isConnected }),
    [isConnected, tableNumber]
  );

  return (
    <TableSocketContext.Provider value={value}>
      {children}
    </TableSocketContext.Provider>
  );
}

export function useTableSocket() {
  const context = useContext(TableSocketContext);
  if (!context) {
    throw new Error('useTableSocket must be used within a TableSocketProvider');
  }
  return context;
}
