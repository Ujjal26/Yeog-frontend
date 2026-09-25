/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      const token =
        sessionStorage.getItem("yoeg_admin_token") ||
        sessionStorage.getItem("yoeg_customer_token");
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
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
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );
  }, []);

  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  /**
   * Updates an order's items in local state after an admin edit.
   * If updatedOrder is null (all items removed), the order is removed from state.
   * Otherwise, replaces the order with the updated version from the server.
   */
  const updateOrderItems = useCallback((orderId, updatedOrder, deleted) => {
    if (deleted || !updatedOrder) {
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, items: updatedOrder.items, total: updatedOrder.total }
            : order,
        ),
      );
    }
  }, []);

  const getOrdersByStatus = useCallback(
    (status) => orders.filter((order) => order.status === status),
    [orders],
  );

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      removeOrder,
      updateOrderItems,
      getOrdersByStatus,
      fetchOrders,
    }),
    [
      orders,
      addOrder,
      updateOrderStatus,
      removeOrder,
      updateOrderItems,
      getOrdersByStatus,
      fetchOrders,
    ],
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
