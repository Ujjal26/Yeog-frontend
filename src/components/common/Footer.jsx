import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer-inner container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">☕</span>
              <span className="logo-text">
                <span className="logo-yeog">Yeog</span>
                <span className="logo-cafe">Cafe</span>
              </span>
            </div>
            <p className="footer-tagline">
              Crafting moments, one cup at a time. Fresh brews, artisan pastries, and a warm welcome.
            </p>
          </div>

          {/* Hours */}
          <div className="footer-section">
            <h4 className="footer-heading">Opening Hours</h4>
            <div className="hours-list">
              <div className="hours-row">
                <span>Monday – Friday</span>
                <span>7:00 AM – 9:00 PM</span>
              </div>
              <div className="hours-row">
                <span>Saturday</span>
                <span>8:00 AM – 10:00 PM</span>
              </div>
              <div className="hours-row">
                <span>Sunday</span>
                <span>8:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="footer-section">
            <h4 className="footer-heading">Connect With Us</h4>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
            </div>
            <p className="footer-address">
              📍 123 Brew Street, Cafeville
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Yeog Cafe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
