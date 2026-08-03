/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTableSocket } from '../../context/TableSocketContext';
import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/common/Navbar';
import MenuCategory from '../../components/customer/MenuCategory';
import CartSummary from '../../components/customer/CartSummary';
import { useOrders } from '../../context/OrderContext';
import './OrderingPage.css';

export default function OrderingPage() {
  const [searchParams] = useSearchParams();
  const urlTableNumber = searchParams.get('table');
  const urlToken = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const { menuItems, menuCategories } = useMenu();
  const { tableNumber, setTable, clearCart } = useCart();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const { socket, isConnected } = useTableSocket();

  useEffect(() => {
    const sessionToken = sessionStorage.getItem('yeog_customer_token');
    
    if (sessionToken) {
      try {
        // Decode JWT payload (basic frontend decode)
        const payload = JSON.parse(atob(sessionToken.split('.')[1]));
        
        // Ensure they are strictly assigned to their locked table
        setTable(payload.tableNumber);
        
        // If they manually tampered with the URL parameter, strip it or correct it
        if (urlTableNumber && parseInt(urlTableNumber, 10) !== payload.tableNumber) {
          navigate('/order', { replace: true });
        } else if (urlToken) {
          navigate('/order', { replace: true });
        }
        
        setIsVerifying(false);
      } catch (err) {
        // Corrupted token, force re-verify
        sessionStorage.removeItem('yeog_customer_token');
        verifyNewScan();
      }
    } else {
      verifyNewScan();
    }

    async function verifyNewScan() {
      if (!urlTableNumber || !urlToken) {
        setErrorMsg('Invalid QR Code. Please scan the QR code on your table.');
        setIsVerifying(false);
        return;
      }
      
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tables/validate-qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNumber: urlTableNumber, qrToken: urlToken })
        });
        
        const data = await res.json();
        if (res.ok) {
          sessionStorage.setItem('yeog_customer_token', data.token);
          setTable(parseInt(urlTableNumber, 10));
          // Strip the secret token from the URL so it can't be easily copied by onlookers
          navigate('/order', { replace: true });
        } else {
          setErrorMsg(data.message || 'Invalid or Expired QR Code.');
        }
      } catch (err) {
        setErrorMsg('Network error verifying QR code.');
      }
      setIsVerifying(false);
    }
  }, [urlTableNumber, urlToken, navigate, setTable]);

  const currentTableOrders = orders.filter(
    (o) => o.tableNumber === parseInt(tableNumber, 10)
  );

  const scrollToCategory = (category) => {
    const el = document.getElementById(`category-${category.toLowerCase()}`);
    if (el) {
      const navHeight = 130;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (isVerifying) {
    return (
      <div className="ordering-page">
        <Navbar variant="customer" />
        <div className="no-table-message container">
          <h2>Securing Connection...</h2>
        </div>
      </div>
    );
  }

  if (errorMsg || !tableNumber) {
    return (
      <div className="ordering-page">
        <Navbar variant="customer" />
        <div className="no-table-message container">
          <div className="no-table-card glass">
            <span className="no-table-icon">🔒</span>
            <h2>{errorMsg || 'Please scan a valid table QR code'}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ordering-page">
      <Navbar variant="customer" tableNumber={tableNumber} />

      {/* Connection Status Indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {/* Sticky Category Nav */}
      <div className="category-nav glass" id="category-nav">
        <div className="category-nav-inner container">
          {menuCategories.map((cat) => (
            <button
              key={cat}
              className="category-pill"
              onClick={() => scrollToCategory(cat)}
            >
              {cat === 'Snacks' && '🍟 '}
              {cat === 'Beverages' && '☕ '}
              {cat === 'Pastries' && '🍰 '}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Current Orders Section */}
      {currentTableOrders.length > 0 && (
        <div className="current-orders-section container animate-slideDown">
          <div className="current-orders-header">
            <h3>Ordered Items</h3>
            <span className="badge badge-primary">Already placed</span>
          </div>
          <div className="current-orders-list">
            {currentTableOrders.map((order) => (
              <div key={order.id} className="current-order-card card">
                <div className="current-order-card-header">
                  <span className="order-id">Order {order.id}</span>
                  <span className={`order-status badge badge-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="current-order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="current-order-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.qty}</span>
                    </div>
                  ))}
                </div>
                <div className='current-order-card-footer'>
                  <span className="order-total">
                    Total: <strong>₹ {order.total}</strong>
                  </span>
                </div>
              </div> 
            ))}
          </div>
        </div>
      )}

      {/* Menu Sections */}
      <main className="ordering-main container">
        {menuItems.length === 0 ? (
          <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
            <div className="no-table-card glass" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
              <span className="no-table-icon" style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🍽️</span>
              <h2>No items in the menu currently</h2>
              <p style={{ color: 'var(--color-text-light)', marginTop: '0.5rem' }}>Our menu is being updated. Please check back shortly!</p>
            </div>
          </div>
        ) : (
          menuCategories.map((category) => {
            const categoryItems = menuItems.filter(
              (item) => item.category === category
            );
            return (
              <MenuCategory
                key={category}
                category={category}
                items={categoryItems}
              />
            );
          })
        )}
      </main>

      {/* Bottom Cart Summary */}
      <CartSummary />

      {/* Spacer for cart summary */}
      <div className="cart-spacer"></div>
    </div>
  );
}
