/* eslint-disable no-unused-vars */
import { useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import OrderTicket from '../../components/admin/OrderTicket';
import './LiveOrdersPage.css';

export default function LiveOrdersPage() {
  const { orders, addOrder, updateOrderStatus, removeOrder } = useOrders();
  const { socket, isConnected } = useSocket();

  // Listen for real-time incoming orders
  useEffect(() => {
    if (!socket) return;

    const handleOrderReceived = (order) => {
      addOrder(order);
    };

    // Another admin tab changed an order status
    const handleStatusChanged = ({ orderId, status }) => {
      updateOrderStatus(orderId, status);
    };

    socket.on('order_received', handleOrderReceived);
    socket.on('order_status_changed', handleStatusChanged);

    return () => {
      socket.off('order_received', handleOrderReceived);
      socket.off('order_status_changed', handleStatusChanged);
    };
  }, [socket, addOrder, updateOrderStatus]);

  const receivedOrders = orders.filter((o) => o.status === 'Received');
  const servedOrders = orders.filter((o) => o.status === 'Served');

  const handleAction = (orderId, nextStatus) => {
    if (nextStatus === null) {
      removeOrder(orderId);
    } else {
      updateOrderStatus(orderId, nextStatus);
      // Notify backend so other admins and the customer table get updated
      if (socket) {
        const order = orders.find((o) => o.id === orderId);
        socket.emit('update_order_status', {
          orderId,
          tableNumber: order?.tableNumber,
          status: nextStatus,
        });
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-mobile-nav">
        <Navbar variant="admin" />
      </div>

      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          <div className="admin-header animate-slideDown">
            <div>
              <h1>Live Orders</h1>
              <p>Track and manage incoming orders in real-time.</p>
            </div>
            <div className="orders-total-badge">
              <span className="badge badge-primary badge-dot">
                {orders.length} total orders
              </span>
            </div>
          </div>

          <div className="orders-bento-grid">
            {/* Received Column */}
            <div className="order-column column-received">
              <div className="column-header">
                <div className="column-dot dot-red"></div>
                <h3>Received</h3>
                <span className="column-count">{receivedOrders.length}</span>
              </div>
              <div className="column-body">
                {receivedOrders.length === 0 ? (
                  <div className="column-empty">
                    <span>📭</span>
                    <p>No new orders</p>
                  </div>
                ) : (
                  receivedOrders.map((order) => (
                    <OrderTicket key={order.id} order={order} onAction={handleAction} />
                  ))
                )}
              </div>
            </div>



            {/* Served Column */}
            <div className="order-column column-served">
              <div className="column-header">
                <div className="column-dot dot-green"></div>
                <h3>Served</h3>
                <span className="column-count">{servedOrders.length}</span>
              </div>
              <div className="column-body">
                {servedOrders.length === 0 ? (
                  <div className="column-empty">
                    <span>🍽️</span>
                    <p>No served orders</p>
                  </div>
                ) : (
                  servedOrders.map((order) => (
                    <OrderTicket key={order.id} order={order} onAction={handleAction} />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
