import { useCombo } from '../../context/ComboContext';
import { formatPrice, timeAgo } from '../../utils/helpers';
import './OrderTicket.css';

export default function OrderTicket({ order, tableName, onAction, onEdit, onItemClick, selectedItem }) {
  const { combos } = useCombo?.() || { combos: [] };

  const statusConfig = {
    Received: {
      color: 'error',
      actionLabel: 'Mark Served',
      nextStatus: 'Served',
    },
    Served: {
      color: 'success',
      actionLabel: 'Served',
      nextStatus: null,
    },
  };

  const config = statusConfig[order.status] || statusConfig.Received;

  return (
    <div className={`order-ticket card status-${config.color}`} id={`order-${order.id}`}>
      <div className="ticket-header">
        <div className="ticket-id-row">
          <span className="ticket-id">{order.id}</span>
          <span className={`badge badge-${config.color} badge-dot`}>
            {order.status}
          </span>
        </div>
        <div className="ticket-meta">
          <span className="ticket-table">🪑 {tableName || `Table ${order.tableNumber}`}</span>
          <span className="ticket-time">{timeAgo(order.timestamp)}</span>
        </div>
      </div>

      <div className="ticket-body">
        <div className="ticket-items">
          {order.items.map((item, idx) => {
            // Check if combo either by explicit flag or matching combo name/id
            const matchedCombo = combos.find(
              (c) =>
                (c.id && c.id === item.id) ||
                (c._id && c._id === item.id) ||
                c.name?.toLowerCase() === item.name?.toLowerCase()
            );

            const isCombo = item.isCombo || Boolean(matchedCombo);
            const effectiveComboItems =
              item.comboItems && item.comboItems.length > 0
                ? item.comboItems
                : (matchedCombo?.items || [])
                    .filter((ci) => ci.item != null)
                    .map((ci) => ({
                      id: ci.item._id || ci.item.id,
                      name: ci.item.name,
                      qty: ci.quantity || 1,
                      isVeg: ci.item.isVeg,
                      description: ci.item.description || '',
                    }));

            const isSelected =
              selectedItem &&
              selectedItem.orderId === order.id &&
              ((item._id && selectedItem._id === item._id) ||
                (item.id && selectedItem.id === item.id) ||
                selectedItem.name === item.name);

            const enrichedItem = {
              ...item,
              isCombo,
              comboItems: effectiveComboItems,
              description: item.description || matchedCombo?.description || '',
            };

            return (
              <div
                key={idx}
                className={`ticket-item-group ${isCombo ? 'ticket-combo-group' : ''} ${
                  isSelected ? 'ticket-item-selected' : ''
                }`}
              >
                <div
                  className={`ticket-item-row ${
                    item.isDone ? 'ticket-item-done' : ''
                  } ${onItemClick ? 'clickable' : ''}`}
                  onClick={() => onItemClick && onItemClick(enrichedItem, order.id)}
                >
                  <span className="ticket-item-qty">{item.qty}×</span>
                  <span className="ticket-item-name">
                    {item.name}
                    {(item.note || item.specialInstructions) && (
                      <span
                        className="ticket-item-star"
                        title={`Special Instruction: ${item.note || item.specialInstructions}`}
                        aria-label="Has special instructions"
                      >
                        ★
                      </span>
                    )}
                    {isCombo && (
                      <span className="ticket-combo-badge">
                        🎁 Combo ({effectiveComboItems.length})
                      </span>
                    )}
                    {item.isDone && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          marginLeft: '8px',
                          color: 'var(--color-success)',
                          fontWeight: 600,
                        }}
                      >
                        (Prepared)
                      </span>
                    )}
                  </span>
                  <span className="ticket-item-price">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>

                {isCombo && effectiveComboItems.length > 0 && (
                  <div
                    className={`ticket-combo-breakdown ${
                      onItemClick ? 'clickable' : ''
                    } ${item.isDone ? 'ticket-combo-breakdown-done' : ''}`}
                    onClick={() => onItemClick && onItemClick(enrichedItem, order.id)}
                    title="Click to view full recipe & prep details in Item Details"
                  >
                    <div className="ticket-combo-breakdown-header">
                      <span>Includes to prepare:</span>
                    </div>
                    {effectiveComboItems.map((sub, sIdx) => {
                      const totalSubQty = (sub.qty || 1) * (item.qty || 1);
                      return (
                        <div key={sIdx} className="ticket-combo-subitem">
                          <span className="ticket-combo-subitem-arrow">↳</span>
                          <span className="ticket-combo-subitem-qty">
                            {totalSubQty}×
                          </span>
                          <span className="ticket-combo-subitem-name">
                            {sub.name}
                            {(sub.note || sub.specialInstructions) && (
                              <span
                                className="ticket-item-star"
                                title={`Special Instruction: ${sub.note || sub.specialInstructions}`}
                                aria-label="Has special instructions"
                              >
                                ★
                              </span>
                            )}
                            {item.qty > 1 && (
                              <span className="ticket-combo-subitem-hint">
                                ({sub.qty}× each)
                              </span>
                            )}
                          </span>
                          {sub.isVeg !== undefined && (
                            <span
                              className={`ticket-sub-veg-dot ${
                                sub.isVeg ? 'veg' : 'non-veg'
                              }`}
                              title={sub.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="ticket-total-row">
          <span>Total</span>
          <span className="ticket-total">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="ticket-footer">
        {onEdit && order.status === 'Received' && (
          <button
            className="btn btn-sm ticket-edit-btn"
            onClick={() => onEdit(order)}
            title="Edit item quantities or cancel items"
          >
            ✏️ Edit
          </button>
        )}
        <button
          className={`btn btn-sm ticket-action-btn ${config.nextStatus ? '' : 'btn-ghost'}`}
          onClick={() => onAction(order.id, config.nextStatus)}
          disabled={!config.nextStatus}
        >
          {config.actionLabel}
        </button>
      </div>
    </div>
  );
}
