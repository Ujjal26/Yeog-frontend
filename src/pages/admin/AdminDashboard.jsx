/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import TableCard from '../../components/admin/TableCard';
import './AdminDashboard.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tables`;

export default function AdminDashboard() {
  const [tables, setTables] = useState([]);
  const { orders, addOrder, removeOrder } = useOrders();
  const { socket, isConnected } = useSocket();

  // Fetch tables from backend on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(API_URL);
        if (res.ok) {
          const data = await res.json();
          setTables(data);
        }
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      }
    };
    fetchTables();
  }, []);

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // A new table scanned a QR code and connected
    const handleNewTable = (data) => {
      setTables((prev) =>
        prev.map((t) =>
          t.number === parseInt(data.tableId, 10)
            ? { ...t, status: 'active' }
            : t
        )
      );
    };

    // A new order was placed by a customer
    const handleOrderReceived = (order) => {
      addOrder(order);
    };

    // Received a list of all currently active tables (e.g. after hard reload)
    const handleActiveTables = (activeTableNumbers) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.status === 'closed') return t;
          if (activeTableNumbers.includes(t.number)) {
            return { ...t, status: 'active' };
          }
          if (t.status === 'active') {
            return { ...t, status: 'available' };
          }
          return t;
        })
      );
    };
    
    const handleTableClosed = (tableNumber) => {
      setTables((prev) =>
        prev.map((t) =>
          t.number === parseInt(tableNumber, 10) && t.status !== 'closed'
            ? { ...t, status: 'available' }
            : t
        )
      );
    };

    socket.on('new_table_joined', handleNewTable);
    socket.on('order_received', handleOrderReceived);
    socket.on('active_tables', handleActiveTables);
    socket.on('table_closed', handleTableClosed);

    return () => {
      socket.off('new_table_joined', handleNewTable);
      socket.off('order_received', handleOrderReceived);
      socket.off('active_tables', handleActiveTables);
      socket.off('table_closed', handleTableClosed);
    };
  }, [socket, addOrder]);

  const stats = {
    active: tables.filter((t) => t.status === 'active').length,
    available: tables.filter((t) => t.status === 'available').length,
    closed: tables.filter((t) => t.status === 'closed').length,
  };

  const handlePaymentDone = (tableId) => {
    const table = tables.find((t) => (t._id || t.id) === tableId);
    if (table) {
      const tableOrders = orders.filter((o) => o.tableNumber === table.number);
      tableOrders.forEach((o) => removeOrder(o.id));

      // Notify backend to disconnect the table's customers
      if (socket) {
        socket.emit('payment_done', table.number);
      }
    }

    setTables((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === tableId) {
          return { ...t, status: 'available' };
        }
        return t;
      })
    );
  };

  return (
    <div className="admin-page">
      {/* Mobile Navbar */}
      <div className="admin-mobile-nav">
        <Navbar variant="admin" />
      </div>

      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          <div className="admin-header animate-slideDown">
            <div>
              <h1>Table Overview</h1>
              <p>Monitor and manage all tables in real-time.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="dashboard-stats animate-slideUp">
            <div className="stat-card stat-active">
              <span className="stat-count">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card stat-available">
              <span className="stat-count">{stats.available}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-card stat-closed">
              <span className="stat-count">{stats.closed}</span>
              <span className="stat-label">Closed</span>
            </div>
          </div>

          {/* Table Grid */}
          <div className="table-grid grid grid-4">
            {tables.map((table) => {
              const tableOrders = orders.filter(
                (o) => o.tableNumber === table.number
              );
              return (
                <TableCard
                  key={table._id || table.id}
                  table={table}
                  orders={tableOrders}
                  onPaymentDone={handlePaymentDone}
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
