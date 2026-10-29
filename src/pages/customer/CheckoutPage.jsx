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
  const { items, tableNumber, tableName, subtotal, tax, total, clearCart } = useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('counter');
  const [successModal, setSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const { socket } = useTableSocket();

  const handlePlaceOrder = () => {
    if (items.length === 0 || isSubmitting) return;

    // BUG-02 FIX: Block submission if socket is not connected.
    // The old code called setSuccessModal(true) and clearCart() unconditionally
    // even when socket?.connected was false, silently dropping the order forever
    // with no error shown to the customer.
    if (!socket?.connected) {
      alert('Connection lost. Please wait a moment for reconnection, then try again.');
      return;
    }

    setIsSubmitting(true);

    const newOrderId = generateOrderId();
    const order = {
      id: newOrderId,
      tableNumber: tableNumber || 0,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        qty: i.qty,
        price: i.price,
        ...((i.note || i.specialInstructions) && {
          note: (i.note || i.specialInstructions).trim(),
          specialInstructions: (i.note || i.specialInstructions).trim(),
        }),
        // Pass combo breakdown through so kitchen can see constituent dishes
        ...(i.isCombo && {
          isCombo: true,
          comboItems: i.comboItems || [],
        }),
      })),
      status: 'Received',
      timestamp: new Date().toISOString(),
      total: total,
    };

    // BUG-02 FIX: Emit with an acknowledgement callback.
    // Cart is cleared and success modal is shown ONLY after the server confirms
    // the order was saved. On failure, an error alert is shown so the customer
    // knows to try again — the cart remains intact.
    socket.emit('new_order', order, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        // Server confirmed: use server-returned order for accurate total/id
        addOrder(res.order || order);
        setOrderId(newOrderId);
        setSuccessModal(true);
      } else {
        alert(res?.message || 'Failed to place order. Please try again.');
      }
    });
  };

  const handleSuccessClose = () => {
    clearCart();
    setSuccessModal(false);
    setIsSubmitting(false);
    navigate(`/order?table=${tableNumber}`);
  };

  if (items.length === 0 && !successModal) {
    return (
      <div className="checkout-page">
        <Navbar variant="customer" tableNumber={tableNumber} tableName={tableName} />
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
      <Navbar variant="customer" tableNumber={tableNumber} tableName={tableName} />

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
              disabled={isSubmitting}
              id="place-order-btn"
            >
              {isSubmitting ? 'Processing...' : `Place Order · ${formatPrice(total)}`}
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
