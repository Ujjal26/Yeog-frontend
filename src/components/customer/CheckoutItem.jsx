import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import './CheckoutItem.css';

export default function CheckoutItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="checkout-item" id={`checkout-item-${item.id}`}>
      <div className="checkout-item-image">
        <img src={item.image} alt={item.name} />
      </div>
      <div className="checkout-item-info">
        <h4 className="checkout-item-name">
          {item.isCombo && <span className="combo-tag">🎁 </span>}
          {item.name}
        </h4>
        {/* Sub-items breakdown for combo orders */}
        {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
          <ul className="checkout-combo-items">
            {item.comboItems.map((ci, idx) => (
              <li key={idx} className="checkout-combo-item">
                ↳ {ci.qty > 1 ? `${ci.qty}× ` : ''}{ci.name}
              </li>
            ))}
          </ul>
        )}
        {/* Special Instructions / Note */}
        {item.note && (
          <p className="checkout-item-note">
            📝 Note: <em>{item.note}</em>
          </p>
        )}
        <span className="checkout-item-unit-price">{formatPrice(item.price)} each</span>
      </div>
      <div className="checkout-item-controls">
        <div className="qty-controls">
          <button
            className="qty-btn"
            onClick={() => item.qty <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.qty - 1)}
            aria-label="Decrease"
          >
            −
          </button>
          <span className="qty-value">{item.qty}</span>
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.qty + 1)}
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </div>
      <div className="checkout-item-total">
        <span className="line-total">{formatPrice(item.price * item.qty)}</span>
        <button
          className="remove-btn"
          onClick={() => removeItem(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

