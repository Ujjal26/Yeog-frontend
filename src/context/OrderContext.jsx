/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('yeog_admin_token') || sessionStorage.getItem('yeog_customer_token');
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = useCallback((order) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  }, []);

  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  const getOrdersByStatus = useCallback(
    (status) => orders.filter((order) => order.status === status),
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      removeOrder,
      getOrdersByStatus,
      fetchOrders,
    }),
    [orders, addOrder, updateOrderStatus, removeOrder, getOrdersByStatus, fetchOrders]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
