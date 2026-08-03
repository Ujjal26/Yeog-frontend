import { formatPrice } from '../../utils/helpers';
import './TableCard.css';

export default function TableCard({ table, orders, onPaymentDone }) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'table-active',
      dotColor: 'var(--color-warning)',
    },
    available: {
      label: 'Available',
      className: 'table-available',
      dotColor: 'var(--color-success)',
    },
    closed: {
      label: 'Closed',
      className: 'table-closed',
      dotColor: 'var(--color-gray)',
    },
  };

  const config = statusConfig[table.status] || statusConfig.available;

  // Format time properly just in case it's a full ISO string from mockOrders
  const formatTime = (timeStr) => {
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr;
  };

  return (
    <div className={`table-card card ${config.className}`} id={`table-${table.number}`}>
      <div className="table-card-header">
        <span className="table-number">Table {table.number}</span>
        <span className="table-status-indicator">
          <span className="status-dot" style={{ background: config.dotColor }}></span>
          {config.label}
        </span>
      </div>

      {table.status === 'active' && orders && orders.length > 0 && (
        <div className="table-card-body">
          <div className="table-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="table-order-group">
                <div className="table-order-info">
                  <span className="table-order-id">{order.id}</span>
                  <span className="table-order-time">{formatTime(order.timestamp || order.time)}</span>
                </div>
                <div className="table-order-items">
                  {order.items.map((item, idx) => (
                    <span key={idx} className="table-order-item">
                      {typeof item === 'string' ? item : `${item.name} x${item.qty}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="table-card-footer">
            <span className="table-order-total">
              {formatPrice(orders.reduce((sum, order) => sum + order.total, 0))}
            </span>
            <button
              className="btn btn-sm btn-primary table-pay-btn"
              onClick={() => onPaymentDone(table._id || table.id)}
            >
              💳 Payment Done
            </button>
          </div>
        </div>
      )}

      {table.status === 'active' && (!orders || orders.length === 0) && (
        <div className="table-card-body">
          <div className="table-card-empty" style={{ flex: 1 }}>
            <span className="empty-icon">👀</span>
            <span>Browsing menu</span>
          </div>
          <div className="table-card-footer" style={{ borderTop: 'none', justifyContent: 'center' }}>
            <button
              className="btn btn-sm btn-ghost table-pay-btn"
              style={{ width: '100%' }}
              onClick={() => onPaymentDone(table._id || table.id)}
            >
              Reset Table
            </button>
          </div>
        </div>
      )}

      {table.status === 'available' && (
        <div className="table-card-empty">
          <span className="empty-icon">✨</span>
          <span>Ready for guests</span>
        </div>
      )}

      {table.status === 'closed' && (
        <div className="table-card-empty">
          <span className="empty-icon">🔒</span>
          <span>Table closed</span>
        </div>
      )}
    </div>
  );
}
