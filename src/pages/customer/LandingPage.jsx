import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseTableParams, isValidTableAccess } from '../../utils/urlParser';
import Modal from '../../components/common/Modal';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  const [tableModal, setTableModal] = useState(false);

  const handleOrderNow = () => {
    const params = parseTableParams(location.search);
    const validation = isValidTableAccess(params);

    if (validation.valid) {
      navigate(`/order?table=${validation.tableNumber}`);
    } else if (!params.table) {
      // No QR params (direct visit) → show table selector instead of error
      setTableModal(true);
    } else {
      // Has QR params but they are invalid or table is closed
      setErrorModal({ open: true, message: validation.error });
    }
  };



  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-overlay"></div>
        <div className="hero-particles">
          <span className="particle">☕</span>
          <span className="particle">🍰</span>
          <span className="particle">🌿</span>
          <span className="particle">✨</span>
        </div>
        <div className="hero-content animate-fadeIn">
          <span className="hero-badge">Est. 2024 · Artisan Café</span>
          <h1 className="hero-title">
            Welcome to <br />
            <span className="hero-brand">Yeog Cafe</span>
          </h1>
          <p className="hero-subtitle">
            Where every sip tells a story. Fresh brews, artisan pastries, 
            and a cozy atmosphere crafted just for you.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg hero-cta"
              onClick={handleOrderNow}
              id="order-now-btn"
            >
              <span>Order Now</span>
              <span className="cta-arrow">→</span>
            </button>
            <a href="#our-story" className="btn btn-ghost btn-lg">
              Our Story
            </a>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="story-section section" id="our-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-image-col animate-slideUp">
              <div className="story-image-card">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=700&fit=crop"
                  alt="Cozy cafe interior with warm lighting"
                  className="story-image"
                />
                <div className="story-image-accent"></div>
              </div>
            </div>
            <div className="story-text-col">
              <div className="section-title text-left">
                <h2>Our Story</h2>
                <div className="decorative-line" style={{ margin: 'var(--space-md) 0 0' }}></div>
              </div>
              <p className="story-text">
                Yeog Cafe was born from a simple belief: that the best moments 
                in life happen over a great cup of coffee. Nestled in the heart 
                of the city, we've been serving handcrafted beverages and fresh 
                pastries since 2024.
              </p>
              <p className="story-text">
                Every bean is ethically sourced, every pastry baked fresh daily, 
                and every moment in our space designed to feel like home. Whether 
                you're here for a quick espresso or a leisurely afternoon, we're 
                here to make it memorable.
              </p>
              <div className="story-stats">
                <div className="stat-item">
                  <span className="stat-number">2K+</span>
                  <span className="stat-label">Cups Daily</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15+</span>
                  <span className="stat-label">Brew Styles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Organic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section className="hours-section section" id="hours">
        <div className="container">
          <div className="section-title">
            <h2>Visit Us</h2>
            <p>We're open every day to serve you the finest experience.</p>
            <div className="decorative-line"></div>
          </div>
          <div className="hours-card card card-elevated">
            <div className="hours-grid">
              <div className="hours-block">
                <span className="hours-day-icon">☀️</span>
                <h4>Weekdays</h4>
                <p className="hours-time">7:00 AM – 9:00 PM</p>
                <span className="hours-note">Full menu available</span>
              </div>
              <div className="hours-divider"></div>
              <div className="hours-block">
                <span className="hours-day-icon">🌤️</span>
                <h4>Saturday</h4>
                <p className="hours-time">8:00 AM – 10:00 PM</p>
                <span className="hours-note">Live acoustic evenings</span>
              </div>
              <div className="hours-divider"></div>
              <div className="hours-block">
                <span className="hours-day-icon">🌅</span>
                <h4>Sunday</h4>
                <p className="hours-time">8:00 AM – 8:00 PM</p>
                <span className="hours-note">Brunch specials</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* QR Code Required Modal (fallback when no QR params) */}
      <Modal
        isOpen={tableModal}
        onClose={() => setTableModal(false)}
        title="Scan QR Code"
        size="small"
      >
        <div className="table-selector-content">
          <div className="qr-prompt-icon">📱</div>
          <p className="table-selector-desc">
            No QR code detected. Please scan the QR on your table number to continue ordering.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setTableModal(false)}
            style={{ marginTop: 'var(--space-md)', width: '100%' }}
          >
            Got It
          </button>
        </div>
      </Modal>

      {/* Error Modal (for invalid status etc.) */}
      <Modal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Cannot Place Order"
        size="small"
      >
        <div className="error-modal-content">
          <div className="error-icon">⚠️</div>
          <p>{errorModal.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => setErrorModal({ open: false, message: '' })}
            style={{ marginTop: 'var(--space-md)', width: '100%' }}
          >
            Got It
          </button>
        </div>
      </Modal>
    </div>
  );
}
