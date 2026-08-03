import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';
import './CartSummary.css';

export default function CartSummary() {
  const { totalItems, total } = useCart();
  const navigate = useNavigate();

  if (totalItems === 0) return null;

  return (
    <div className="cart-summary animate-slideUp" id="cart-summary">
      <div className="cart-summary-inner">
        <div className="cart-info">
          <div className="cart-count-bubble">
            <span>{totalItems}</span>
          </div>
          <div className="cart-text">
            <span className="cart-items-label">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span className="cart-total">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          className="btn btn-primary cart-checkout-btn"
          onClick={() => navigate('/checkout')}
          id="view-cart-btn"
        >
          View Cart →
        </button>
      </div>
    </div>
  );
}
