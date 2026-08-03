import { formatPrice, timeAgo } from '../../utils/helpers';
import './OrderTicket.css';

export default function OrderTicket({ order, onAction }) {
  const statusConfig = {
    Received: {
      color: 'error',
      actionLabel: 'Mark Served',
      nextStatus: 'Served',
    },
    Served: {
      color: 'success',
      actionLabel: 'Complete',
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
          <span className="ticket-table">🪑 Table {order.tableNumber}</span>
          <span className="ticket-time">{timeAgo(order.timestamp)}</span>
        </div>
      </div>

      <div className="ticket-body">
        <div className="ticket-items">
          {order.items.map((item, idx) => (
            <div key={idx} className="ticket-item-row">
              <span className="ticket-item-qty">{item.qty}×</span>
              <span className="ticket-item-name">{item.name}</span>
              <span className="ticket-item-price">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="ticket-total-row">
          <span>Total</span>
          <span className="ticket-total">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="ticket-footer">
        <button
          className={`btn btn-sm ticket-action-btn ${config.nextStatus ? '' : 'btn-ghost'}`}
          onClick={() => onAction(order.id, config.nextStatus)}
        >
          {config.actionLabel}
        </button>
      </div>
    </div>
  );
}
