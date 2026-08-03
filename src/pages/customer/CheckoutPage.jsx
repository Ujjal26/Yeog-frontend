/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableSocket } from '../../context/TableSocketContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { formatPrice, generateOrderId } from '../../utils/helpers';
import Navbar from '../../components/common/Navbar';
import CheckoutItem from '../../components/customer/CheckoutItem';
import Modal from '../../components/common/Modal';
import './CheckoutPage.css';


export default function CheckoutPage() {
  const { items, tableNumber, subtotal, tax, total, clearCart } = useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('counter');
  const [successModal, setSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const { socket } = useTableSocket();

  const handlePlaceOrder = () => {
    if (items.length === 0) return;

    const newOrderId = generateOrderId();
    const order = {
      id: newOrderId,
      tableNumber: tableNumber || 0,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      status: 'Received',
      timestamp: new Date().toISOString(),
      total: total,
    };

    addOrder(order);
    setOrderId(newOrderId);
    setSuccessModal(true);

    // Emit order to backend → broadcasts to admin in real-time
    if (socket?.connected) {
      socket.emit('new_order', order);
    }
  };

  const handleSuccessClose = () => {
    clearCart();
    setSuccessModal(false);
    navigate(`/order?table=${tableNumber}`);
  };

  if (items.length === 0 && !successModal) {
    return (
      <div className="checkout-page">
        <Navbar variant="customer" tableNumber={tableNumber} />
        <div className="checkout-empty container">
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/order?table=${tableNumber}`)}
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar variant="customer" tableNumber={tableNumber} />

      <main className="checkout-main container">
        <div className="checkout-header animate-slideUp">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back to Menu
          </button>
          <h1>Checkout</h1>
          <p>Review your order before placing it.</p>
        </div>

        <div className="checkout-grid">
          {/* Items List */}
          <div className="checkout-items-section animate-slideUp">
            <div className="card">
              <div className="checkout-items-header">
                <h3>Order Items</h3>
                <span className="badge badge-primary">{items.length} items</span>
              </div>
              <div className="checkout-items-list">
                {items.map((item) => (
                  <CheckoutItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="checkout-summary-section animate-slideUp stagger-2">
            {/* Price Breakdown */}
            <div className="card price-card">
              <h3 className="price-card-title">Price Summary</h3>
              <div className="price-rows">
                <div className="price-row price-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card payment-card">
              <h3 className="payment-card-title">Payment Method</h3>
              <div className="payment-options">
                <label
                  className={`radio-card ${paymentMethod === 'counter' ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="counter"
                    checked={paymentMethod === 'counter'}
                    onChange={() => setPaymentMethod('counter')}
                  />
                  <span className="payment-icon">💵</span>
                  <div className="payment-info">
                    <span className="payment-label">Pay at Counter</span>
                    <span className="payment-desc">Cash or card at checkout</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order */}
            <button
              className="btn btn-primary btn-lg place-order-btn"
              onClick={handlePlaceOrder}
              id="place-order-btn"
            >
              Place Order · {formatPrice(total)}
            </button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <Modal
        isOpen={successModal}
        onClose={handleSuccessClose}
        title="Order Placed!"
        size="small"
      >
        <div className="success-modal-content">
          <div className="success-checkmark">✅</div>
          <h3>Thank you!</h3>
          <p>Your order <strong>{orderId}</strong> has been received.</p>
          <p className="success-note">
            Your order is being prepared. You can continue ordering more items!
          </p>
          <button
            className="btn btn-primary"
            onClick={handleSuccessClose}
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
          >
            Order More
          </button>
        </div>
      </Modal>
    </div>
  );
}
