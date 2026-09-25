/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useSocket } from '../../context/SocketContext';
import { useMenu } from '../../context/MenuContext';
import Navbar from '../../components/common/Navbar';
import OrderTicket from '../../components/admin/OrderTicket';
import './KitchenPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const TABLES_API = `${API_BASE}/api/tables`;

export default function KitchenPage() {
  const { orders, addOrder, updateOrderStatus, removeOrder, updateOrderItems } = useOrders();
  const { socket } = useSocket();
  const { menuItems } = useMenu();
  const [tables, setTables] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch tables once to resolve names
  useEffect(() => {
    fetch(TABLES_API)
      .then((r) => r.json())
      .then(setTables)
      .catch(() => {});
  }, []);

  // Helper: resolve a display label for a table number
  const getTableLabel = (tableNumber) => {
    const t = tables.find((t) => t.number === tableNumber);
    return t && t.name ? t.name : `Table ${tableNumber}`;
  };

  // Listen for real-time incoming orders
  useEffect(() => {
    if (!socket) return;

    const handleOrderReceived = (order) => {
      addOrder(order);
    };

    // Another admin/kitchen tab changed an order status
    const handleStatusChanged = ({ orderId, status }) => {
      updateOrderStatus(orderId, status);
    };

    // Another admin tab edited an order's items
    const handleOrderItemEdited = ({ orderId, updatedOrder, deleted }) => {
      updateOrderItems(orderId, updatedOrder, deleted);
    };

    socket.on('order_received', handleOrderReceived);
    socket.on('order_status_changed', handleStatusChanged);
    socket.on('order_item_edited', handleOrderItemEdited);

    return () => {
      socket.off('order_received', handleOrderReceived);
      socket.off('order_status_changed', handleStatusChanged);
      socket.off('order_item_edited', handleOrderItemEdited);
    };
  }, [socket, addOrder, updateOrderStatus, updateOrderItems]);

  const receivedOrders = orders.filter((o) => o.status === 'Received');

  // Auto-refresh logic: reload the page a few seconds after the last order is cleared
  // to ensure a clean state and stable connection.
  const [hadOrders, setHadOrders] = useState(false);

  useEffect(() => {
    if (receivedOrders.length > 0) {
      setHadOrders(true);
    } else if (hadOrders && receivedOrders.length === 0) {
      // Transitioned from having orders to having none
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000); // Wait 3 seconds so the staff sees the box is empty before flashing
      return () => clearTimeout(timer);
    }
  }, [receivedOrders.length, hadOrders]);

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

  const handleMarkPrepared = async () => {
    if (!selectedItem || !selectedItem.orderId) return;
    const token = sessionStorage.getItem('yoeg_admin_token');
    try {
      const itemId = selectedItem._id || selectedItem.id || selectedItem.name;
      const res = await fetch(`${API_BASE}/api/orders/${selectedItem.orderId}/items/${itemId}/done`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const result = await res.json();
        // Update local context
        updateOrderItems(selectedItem.orderId, result.order, false);
        // Emit to other clients so admin panel updates
        if (socket) {
          socket.emit('edit_order_item', {
            orderId: selectedItem.orderId,
            tableNumber: result.order.tableNumber,
            updatedOrder: result.order,
            deleted: false
          });
        }
        // Update local selection
        setSelectedItem((prev) => ({ ...prev, isDone: true }));
      }
    } catch (err) {
      console.error("Failed to mark item as prepared:", err);
    }
  };

  return (
    <div className="kitchen-page">
      <div className="kitchen-mobile-nav">
        <Navbar variant="kitchen" />
      </div>

      <div className="kitchen-layout">
        <main className="kitchen-main">
          <div className="kitchen-header animate-slideDown">
            <div>
              <h1>Kitchen Display</h1>
              <p>Live incoming orders.</p>
            </div>
            <div className="orders-total-badge">
              <span className="badge badge-primary badge-dot" style={{ marginTop: "1rem" }}>
                {receivedOrders.length} pending orders
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
                    <OrderTicket
                      key={order.id}
                      order={order}
                      tableName={getTableLabel(order.tableNumber)}
                      onAction={handleAction}
                      onItemClick={(item, orderId) => setSelectedItem({ ...item, orderId })}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Item Details Column */}
            <div className="order-column column-description">
              <div className="column-header">
                <div className="column-dot dot-blue"></div>
                <h3>Item Details</h3>
              </div>
              <div className="column-body">
                {!selectedItem ? (
                  <div className="column-empty">
                    <span>ℹ️</span>
                    <p>Click on an item in an order to see its description here.</p>
                  </div>
                ) : (
                  (() => {
                    const fullItem = menuItems.find(m => m.id === selectedItem.id || m.name === selectedItem.name);
                    const displayDesc = fullItem?.description || selectedItem.description || "No description provided for this item.";
                    
                    return (
                      <div className="item-detail-card animate-scaleIn">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h2>{selectedItem.name}</h2>
                          {selectedItem.isDone ? (
                            <span className="badge badge-success" style={{background: 'rgba(39, 174, 96, 0.2)', color: 'var(--color-success)'}}>
                              ✓ Prepared
                            </span>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={handleMarkPrepared}>
                              Mark as Prepared
                            </button>
                          )}
                        </div>
                        <div className="item-detail-meta">
                          <span className="badge badge-primary">Quantity: {selectedItem.qty}</span>
                        </div>
                        <div className="item-detail-desc">
                          {displayDesc}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
