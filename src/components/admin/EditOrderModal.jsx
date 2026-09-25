import { useState } from 'react';
import { formatPrice } from '../../utils/helpers';
import './EditOrderModal.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * EditOrderModal
 * Admin modal to edit individual items within an order — reduce quantity or cancel items.
 * Calls the REST API to persist changes and emits a socket event for real-time sync.
 *
 * @param {Object} props
 * @param {Object} props.order - The order being edited.
 * @param {string} props.tableName - Display label for the table.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {Function} props.onSave - Callback after successful save: (orderId, updatedOrder, deleted) => void
 * @param {Object} props.socket - Socket.IO client instance for real-time broadcast.
 */
export default function EditOrderModal({ order, tableName, onClose, onSave, socket }) {
  // Track edited quantities per item; initialize from current order items
  const [editedItems, setEditedItems] = useState(
    order.items.map((item) => ({
      ...item,
      editQty: item.qty,
      cancelled: false,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleQtyChange = (index, delta) => {
    setEditedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = Math.max(0, Math.min(item.qty, item.editQty + delta));
        return {
          ...item,
          editQty: newQty,
          cancelled: newQty === 0,
        };
      })
    );
  };

  const handleCancel = (index) => {
    setEditedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editQty: 0, cancelled: true } : item
      )
    );
  };

  const handleRestore = (index) => {
    setEditedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editQty: item.qty, cancelled: false } : item
      )
    );
  };

  // Check if any changes were made
  const hasChanges = editedItems.some((item) => item.editQty !== item.qty);

  // Compute new total
  const newTotal = editedItems.reduce(
    (sum, item) => sum + item.price * item.editQty,
    0
  );

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    setError('');

    const token = sessionStorage.getItem('yoeg_admin_token');

    try {
      // Process each changed item sequentially
      const changedItems = editedItems.filter((item) => item.editQty !== item.qty);

      let latestOrder = null;
      let orderDeleted = false;

      for (const item of changedItems) {
        const itemId = item._id || item.id || null;
        const res = await fetch(`${API_BASE}/api/orders/${order.id}/edit-item`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            itemId: itemId || undefined,
            itemName: item.name,
            newQty: item.editQty,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update item');
        }

        const result = await res.json();
        latestOrder = result.order;
        orderDeleted = result.deleted;

        // If order was fully deleted, stop processing
        if (orderDeleted) break;
      }

      // Broadcast to other tabs and customer
      if (socket) {
        socket.emit('edit_order_item', {
          orderId: order.id,
          tableNumber: order.tableNumber,
          updatedOrder: latestOrder,
          deleted: orderDeleted,
        });
      }

      onSave(order.id, latestOrder, orderDeleted);
      onClose();
    } catch (err) {
      console.error('Error saving order edits:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="edit-order-modal animate-scaleIn" role="dialog" aria-modal="true">
        <div className="edit-modal-header">
          <div>
            <h3>Edit Order</h3>
            <p className="edit-modal-subtitle">
              <span className="edit-modal-id">{order.id}</span>
              <span className="edit-modal-table">🪑 {tableName}</span>
            </p>
          </div>
          <button className="edit-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div className="edit-modal-error animate-slideUp">{error}</div>
        )}

        <div className="edit-modal-body">
          <div className="edit-items-list">
            {editedItems.map((item, idx) => (
              <div
                key={idx}
                className={`edit-item-row ${item.cancelled ? 'edit-item-cancelled' : ''}`}
              >
                <div className="edit-item-info">
                  <span className="edit-item-name">{item.name}</span>
                  <span className="edit-item-price">
                    {formatPrice(item.price)} each
                  </span>
                </div>
                <div className="edit-item-controls">
                  {item.cancelled ? (
                    <button
                      className="btn btn-sm edit-restore-btn"
                      onClick={() => handleRestore(idx)}
                    >
                      ↩ Restore
                    </button>
                  ) : (
                    <>
                      <div className="edit-qty-stepper">
                        <button
                          className="edit-qty-btn"
                          onClick={() => handleQtyChange(idx, -1)}
                          disabled={item.editQty <= 0}
                        >
                          −
                        </button>
                        <span className="edit-qty-value">{item.editQty}</span>
                        <button
                          className="edit-qty-btn"
                          onClick={() => handleQtyChange(idx, 1)}
                          disabled={item.editQty >= item.qty}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="btn btn-sm edit-cancel-item-btn"
                        onClick={() => handleCancel(idx)}
                        title="Cancel this item"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
                <div className="edit-item-subtotal">
                  {item.cancelled ? (
                    <span className="edit-item-cancelled-label">Cancelled</span>
                  ) : (
                    <span>{formatPrice(item.price * item.editQty)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="edit-modal-summary">
            <div className="edit-total-row">
              <span>Original Total</span>
              <span className="edit-original-total">{formatPrice(order.total)}</span>
            </div>
            <div className="edit-total-row edit-new-total-row">
              <span>New Total</span>
              <span className="edit-new-total">{formatPrice(newTotal)}</span>
            </div>
            {hasChanges && order.total !== newTotal && (
              <div className="edit-savings-row">
                <span>Reduced by</span>
                <span className="edit-savings">{formatPrice(order.total - newTotal)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="edit-modal-footer">
          <button className="btn btn-sm btn-ghost edit-footer-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm btn-primary edit-footer-btn"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
