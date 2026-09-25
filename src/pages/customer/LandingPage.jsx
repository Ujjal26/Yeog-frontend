/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { parseTableParams, isValidTableAccess } from "../../utils/urlParser";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [tableModal, setTableModal] = useState(false);

  // Auto-redirect to active session if returning user
  useEffect(() => {
    const token = localStorage.getItem("yoeg_customer_token");
    // If they have a token, skip the landing page and try to resume
    if (token) {
      navigate("/order", { replace: true });
    }
  }, [navigate]);

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
        <img src="https://res.cloudinary.com/uu1wrvud/image/upload/v1789457866/IMG_20260915_130556.jpg" alt="Yoeg" className="hero-image" />
        <div className="hero-content animate-fadeIn">
          <span className="hero-badge">Est. 2026</span>
          <h1 className="hero-title">
            Welcome to <br />
            <span className="hero-brand">yoeg Cafe</span>
          </h1>
          <p className="hero-subtitle">
            You Only Eat Good..!!!
          </p>
          <div className="hero-actions">
            <button
            >
              <a href="#our-story"className="btn btn-primary btn-lg hero-cta">Our Story →</a>
            </button>
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
                <div
                  className="decorative-line"
                  style={{ margin: "var(--space-md) 0 0" }}
                ></div>
              </div>
              <p className="story-text">
                yoeg Cafe was born from a simple belief: that the best moments
                in life happen over a great cup of coffee. Nestled in the heart
                of the city, we've been serving handcrafted beverages and fresh
                pastries since 2026.
              </p>
              <p className="story-text">
                Every bean is ethically sourced, every pastry baked fresh daily,
                and every moment in our space designed to feel like home.
                Whether you're here for a quick espresso or a leisurely
                afternoon, we're here to make it memorable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cafe Interior Section */}
      <section className="cafe-interior-section section" id="cafe-interior">
        <div className="container">
          <div className="section-title">
            <h2>Cafe Interior</h2>
            <p>Take a glimpse of our cafe's interior.</p>
            <div className="decorative-line"></div>
          </div>
          <div className="cafe-interior-grid">
            <div className="cafe-interior-card">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsTkpRk3DqfOdQBf5fJrGIzuG8cgFYMF59fzJgcCrxMQ&s=10"
                alt="pool Table"
                className="cafe-interior-image"
              />
              <p className="cafe-interior-card-text">Enjoy Pool table with friends</p>
            </div>
            <div className="cafe-interior-card">
              <img
                src="https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&q=80&w=800"
                alt="Chess board setup"
                className="cafe-interior-image"
              />
              <p className="cafe-interior-card-text">Beat your friends using strategies and skill in chess</p>
            </div>
            <div className="cafe-interior-card">
              <img
                src="https://thumbs.dreamstime.com/b/pile-uno-cards-table-bend-usa-september-pile-uno-cards-table-126269733.jpg"
                alt="Playing cards"
                className="cafe-interior-image"
              />
              <p className="cafe-interior-card-text">Play Uno and other card games with your friends</p>
            </div>
            <div className="cafe-interior-card">
              <img
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800"
                alt="coffee collection"
                className="cafe-interior-image"
              />
              <p className="cafe-interior-card-text">Experience our premium coffee collection</p>
            </div>
            <div className="cafe-interior-card">
              <img
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800"
                alt="Cozy cafe interior with warm lighting"
                className="cafe-interior-image"
              />
              <p className="cafe-interior-card-text">Relax in our aesthetic seating areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      <section className="menu-preview-section section" id="menu-preview">
        <div className="container">
          <div className="section-title">
            <h2>Menu Preview</h2>
            <p>What We Serve here.</p>
            <div className="decorative-line"></div>
          </div>
          <div className="menu-preview-track-container">
            <Swiper
              modules={[Autoplay]}
              spaceBetween={32}
              slidesPerView="auto"
              loop={true}
              speed={4000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              grabCursor={true}
              className="menu-preview-swiper"
            >
              {[
                { img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=600", title: "Rich Espresso" },
                { img: "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?auto=format&fit=crop&q=80&w=600", title: "Classic Cappuccino" },
                { img: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&q=80&w=600", title: "Matcha Latte" },
                { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh1uvEtFoLQr8Fn5HkYuErtQ9-GaTiK7kkaMPvdf8bkq2Ms5xeo3eIcVg&s=10", title: "Butter Croissant" },
                { img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=600", title: "Blueberry Muffin" },
                { img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=600", title: "Avocado Toast" },
                { img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=600", title: "Iced Coffee" },
                { img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600", title: "Berry Cheesecake" }
              ].map((item, index) => (
                <SwiperSlide key={index} className="menu-preview-slide">
                  <div className="menu-preview-card">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="menu-preview-image"
                    />
                    <div className="menu-preview-overlay">
                      <p className="menu-preview-card-text">{item.title}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
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
                <span className="hours-day-icon">👨‍🍳</span>
                <h4>Wednesday to Monday</h4>
                <p className="hours-time">3:00 PM – 10:00 PM</p>
                <span className="hours-note">Full menu available</span>
              </div>
              <div className="hours-divider"></div>
              <div className="hours-block">
                <span className="hours-day-icon">😴</span>
                <h4>Tuesday</h4>
                <p className="hours-time">CLOSED</p>
                <span className="hours-note">We'll be back tomorrow!</span>
              </div>
              {/* <div className="hours-divider"></div>
              <div className="hours-block">
                <span className="hours-day-icon">🌅</span>
                <h4>Sunday</h4>
                <p className="hours-time">8:00 AM – 8:00 PM</p>
                <span className="hours-note">Brunch specials</span>
              </div> */}
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
            No QR code detected. Please scan the QR on your table number to
            continue ordering.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setTableModal(false)}
            style={{ marginTop: "var(--space-md)", width: "100%" }}
          >
            Got It
          </button>
        </div>
      </Modal>

      {/* Error Modal (for invalid status etc.) */}
      <Modal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        title="Cannot Place Order"
        size="small"
      >
        <div className="error-modal-content">
          <div className="error-icon">⚠️</div>
          <p>{errorModal.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => setErrorModal({ open: false, message: "" })}
            style={{ marginTop: "var(--space-md)", width: "100%" }}
          >
            Got It
          </button>
        </div>
      </Modal>
    </div>
  );
}
