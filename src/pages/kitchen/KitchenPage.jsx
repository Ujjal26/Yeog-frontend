/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useSocket } from '../../context/SocketContext';
import { useMenu } from '../../context/MenuContext';
import { useCombo } from '../../context/ComboContext';
import Navbar from '../../components/common/Navbar';
import OrderTicket from '../../components/admin/OrderTicket';
import './KitchenPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const TABLES_API = `${API_BASE}/api/tables`;

export default function KitchenPage() {
  const { orders, addOrder, updateOrderStatus, removeOrder, updateOrderItems } = useOrders();
  const { socket } = useSocket();
  const { menuItems } = useMenu();
  const { combos } = useCombo?.() || { combos: [] };
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
      if (selectedItem && selectedItem.orderId === orderId) {
        const updatedItem = updatedOrder?.items?.find(
          (i) =>
            (i._id && i._id === selectedItem._id) ||
            (i.id && i.id === selectedItem.id) ||
            i.name === selectedItem.name
        );
        if (updatedItem) {
          setSelectedItem((prev) => ({ ...prev, ...updatedItem }));
        }
      }
    };

    socket.on('order_received', handleOrderReceived);
    socket.on('order_status_changed', handleStatusChanged);
    socket.on('order_item_edited', handleOrderItemEdited);

    return () => {
      socket.off('order_received', handleOrderReceived);
      socket.off('order_status_changed', handleStatusChanged);
      socket.off('order_item_edited', handleOrderItemEdited);
    };
  }, [socket, addOrder, updateOrderStatus, updateOrderItems, selectedItem]);

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
      if (selectedItem?.orderId === orderId) {
        setSelectedItem(null);
      }
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
      const res = await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(selectedItem.orderId)}/items/${encodeURIComponent(itemId)}/done`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
            deleted: false,
          });
        }
        // Update local selection
        setSelectedItem((prev) => ({ ...prev, isDone: true }));
      }
    } catch (err) {
      console.error('Failed to mark item as prepared:', err);
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
              <p>Live incoming orders and dish preparation tickets.</p>
            </div>
            <div className="orders-total-badge">
              <span className="badge badge-primary badge-dot" style={{ marginTop: '1rem' }}>
                {receivedOrders.length} pending orders
              </span>
            </div>
          </div>

          <div className="orders-bento-grid">
            {/* Received Column */}
            <div className="order-column column-received">
              <div className="column-header">
                <div className="column-dot dot-red"></div>
                <h3>Received Orders</h3>
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
                      selectedItem={selectedItem}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Item Details Column */}
            <div className="order-column column-description">
              <div className="column-header">
                <div className="column-dot dot-blue"></div>
                <h3>Preparation Details</h3>
              </div>
              <div className="column-body">
                {!selectedItem ? (
                  <div className="column-empty">
                    <span>ℹ️</span>
                    <p>Click on an item or combo in an order to view its recipe &amp; preparation instructions.</p>
                  </div>
                ) : (
                  (() => {
                    // Match against menu items
                    const fullItem = menuItems.find(
                      (m) =>
                        (m._id && m._id === selectedItem.id) ||
                        (m.id && m.id === selectedItem.id) ||
                        m.name?.toLowerCase() === selectedItem.name?.toLowerCase()
                    );

                    // Match against combo bundles
                    const matchedCombo = combos.find(
                      (c) =>
                        (c.id && c.id === selectedItem.id) ||
                        (c._id && c._id === selectedItem.id) ||
                        c.name?.toLowerCase() === selectedItem.name?.toLowerCase()
                    );

                    const isCombo = selectedItem.isCombo || Boolean(matchedCombo);

                    if (isCombo) {
                      // Resolve constituent items
                      const effectiveComboItems =
                        selectedItem.comboItems && selectedItem.comboItems.length > 0
                          ? selectedItem.comboItems
                          : (matchedCombo?.items || [])
                              .filter((ci) => ci.item != null)
                              .map((ci) => ({
                                id: ci.item._id || ci.item.id,
                                name: ci.item.name,
                                qty: ci.quantity || 1,
                                isVeg: ci.item.isVeg,
                                description: ci.item.description || '',
                              }));

                      const comboIsVeg =
                        matchedCombo?.isVeg ??
                        (effectiveComboItems.length > 0 &&
                          effectiveComboItems.every((sub) => {
                            const m = menuItems.find(
                              (item) =>
                                item.name?.toLowerCase() === sub.name?.toLowerCase() ||
                                (item._id && item._id === sub.id)
                            );
                            return m ? m.isVeg : sub.isVeg;
                          }));

                      const comboDesc =
                        matchedCombo?.description || selectedItem.description || '';

                      const totalDishesCount = effectiveComboItems.reduce(
                        (acc, sub) => acc + (sub.qty || 1) * (selectedItem.qty || 1),
                        0
                      );

                      return (
                        <div className="item-detail-card combo-detail-card animate-scaleIn">
                          <div className="combo-detail-header-row">
                            <div>
                              <div className="combo-detail-tags">
                                <span className="badge badge-warning combo-deal-badge">
                                  🎁 Combo Deal
                                </span>
                                <span className={`veg-tag ${comboIsVeg ? 'veg' : 'non-veg'}`}>
                                  <span className="veg-tag-dot" />
                                  {comboIsVeg ? '100% Veg Deal' : 'Non-Veg Deal'}
                                </span>
                              </div>
                              <h2 className="combo-detail-title">{selectedItem.name}</h2>
                            </div>
                            {selectedItem.isDone ? (
                              <span className="badge badge-success combo-prepared-badge">
                                ✓ Prepared
                              </span>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm combo-mark-btn"
                                onClick={handleMarkPrepared}
                              >
                                Mark Combo as Prepared
                              </button>
                            )}
                          </div>

                          <div className="item-detail-meta">
                            <span className="badge badge-primary">
                              Combo Quantity: {selectedItem.qty}
                            </span>
                            <span className="badge badge-neutral">
                              {effectiveComboItems.length} constituent items
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(245, 158, 11, 0.18)',
                                color: '#fde047',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                              }}
                            >
                              🔥 {totalDishesCount} total dishes to prepare
                            </span>
                          </div>

                          {comboDesc && (
                            <div className="combo-detail-overview">
                              <p className="combo-overview-text">"{comboDesc}"</p>
                            </div>
                          )}

                          {/* Constituent Dishes Checklist */}
                          <div className="combo-prep-section">
                            <div className="combo-prep-section-header">
                              <span className="combo-prep-section-icon">👨‍🍳</span>
                              <h4>Dishes to Prepare for this Combo:</h4>
                            </div>

                            <div className="combo-prep-items-grid">
                              {effectiveComboItems.map((sub, sIdx) => {
                                const subMenuItem = menuItems.find(
                                  (m) =>
                                    (m._id && m._id === sub.id) ||
                                    (m.id && m.id === sub.id) ||
                                    m.name?.toLowerCase() === sub.name?.toLowerCase()
                                );
                                const subDesc =
                                  subMenuItem?.description ||
                                  sub.description ||
                                  'Standard recipe preparation.';
                                const subIsVeg = subMenuItem?.isVeg ?? sub.isVeg;
                                const subCategory = subMenuItem?.category;
                                const totalSubQty = (sub.qty || 1) * (selectedItem.qty || 1);

                                return (
                                  <div key={sIdx} className="combo-prep-item-card">
                                    <div className="combo-prep-item-header">
                                      <div className="combo-prep-item-name-group">
                                        <span
                                          className={`combo-prep-item-veg-dot ${
                                            subIsVeg ? 'veg' : 'non-veg'
                                          }`}
                                          title={subIsVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                        />
                                        <span className="combo-prep-item-qty">
                                          {totalSubQty}×
                                        </span>
                                        <span className="combo-prep-item-name">
                                          {sub.name}
                                        </span>
                                        {selectedItem.qty > 1 && (
                                          <span className="combo-prep-subitem-each">
                                            ({sub.qty}× per combo)
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        {subCategory && (
                                          <span
                                            className="badge badge-neutral"
                                            style={{ fontSize: '0.72rem' }}
                                          >
                                            {subCategory}
                                          </span>
                                        )}
                                        <span
                                          className={`badge ${
                                            subIsVeg ? 'badge-success' : 'badge-error'
                                          }`}
                                          style={{ fontSize: '0.72rem' }}
                                        >
                                          {subIsVeg ? 'Veg' : 'Non-Veg'}
                                        </span>
                                      </div>
                                    </div>

                                    {subDesc && (
                                      <p className="combo-prep-item-description">
                                        {subDesc}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Regular Item
                    const displayDesc =
                      fullItem?.description ||
                      selectedItem.description ||
                      'No special preparation instructions provided.';

                    return (
                      <div className="item-detail-card animate-scaleIn">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            {fullItem && (
                              <span
                                className={`veg-tag ${fullItem.isVeg ? 'veg' : 'non-veg'}`}
                                style={{ marginBottom: '6px', display: 'inline-flex' }}
                              >
                                <span className="veg-tag-dot" />
                                {fullItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                              </span>
                            )}
                            <h2>{selectedItem.name}</h2>
                          </div>
                          {selectedItem.isDone ? (
                            <span
                              className="badge badge-success"
                              style={{
                                background: 'rgba(39, 174, 96, 0.2)',
                                color: 'var(--color-success)',
                                padding: '6px 12px',
                              }}
                            >
                              ✓ Prepared
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={handleMarkPrepared}
                            >
                              Mark as Prepared
                            </button>
                          )}
                        </div>
                        <div className="item-detail-meta">
                          <span className="badge badge-primary">
                            Quantity: {selectedItem.qty}
                          </span>
                          {fullItem?.category && (
                            <span className="badge badge-neutral">
                              {fullItem.category}
                            </span>
                          )}
                        </div>
                        <div className="item-detail-desc">{displayDesc}</div>
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
