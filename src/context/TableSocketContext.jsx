/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useCart } from "./CartContext";
import { useOrders } from "./OrderContext";
import { useMenu } from "./MenuContext";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const TableSocketContext = createContext(null);

export function TableSocketProvider({ children }) {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { tableNumber, clearCart, clearTable } = useCart();
  const { updateOrderStatus, updateOrderItems } = useOrders();
  const { fetchMenu } = useMenu();
  const navigate = useNavigate();

  useEffect(() => {
    if (tableNumber) {
      if (!socket.current) {
        const token = sessionStorage.getItem("yoeg_customer_token");
        socket.current = io(SOCKET_URL, {
          auth: { token },
          query: { table: tableNumber },
        });

        socket.current.on("connect", () => {
          setIsConnected(true);
          socket.current.emit("join_table", tableNumber);
        });

        socket.current.on("disconnect", () => {
          setIsConnected(false);
        });

        /**
         * Handles socket connection rejection from the server middleware.
         * Fires when the server rejects the connection because the loginToken in the
         * customer's JWT no longer matches the one stored in the Table DB —
         * i.e. the table was reset / a new customer scanned the QR since this session started.
         * Performs a full logout identical to the table_closed flow.
         */
        socket.current.on("connect_error", (err) => {
          const isSessionError =
            err.message.includes("Session expired") ||
            err.message.includes("Authentication error");

          if (isSessionError) {
            console.warn("[TableSocket] Connection rejected by server:", err.message);
            sessionStorage.removeItem("yoeg_customer_token");
            clearTable();
            socket.current?.disconnect();
            socket.current = null;
            navigate("/");
          }
        });

        // Admin closed this table (payment done) — fully log out the customer
        socket.current.on("table_closed", () => {
          // Remove the customer JWT so the session is fully invalidated
          sessionStorage.removeItem("yoeg_customer_token");
          // Reset cart items AND table identity in context
          clearTable();
          // Disconnect the socket cleanly
          socket.current?.disconnect();
          socket.current = null;
          navigate("/");
        });

        // Admin updated order status
        socket.current.on("order_status_updated", ({ orderId, status }) => {
          updateOrderStatus(orderId, status);
        });

        // Admin edited an order item (reduced quantity or cancelled)
        socket.current.on("order_item_edited", ({ orderId, updatedOrder, deleted }) => {
          if (typeof updateOrderItems === 'function') {
            updateOrderItems(orderId, updatedOrder, deleted);
          }
        });

        // Menu updated by admin (auto-reload menu)
        socket.current.on("menu_updated", () => {
          fetchMenu();
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
  }, [tableNumber, clearCart, clearTable, navigate, updateOrderStatus, updateOrderItems]);

  const value = useMemo(
    () => ({ socket: socket.current, isConnected }),
    [isConnected, tableNumber],
  );

  return (
    <TableSocketContext.Provider value={value}>{children}</TableSocketContext.Provider>
  );
}

export function useTableSocket() {
  const context = useContext(TableSocketContext);
  if (!context) {
    throw new Error("useTableSocket must be used within a TableSocketProvider");
  }
  return context;
}
