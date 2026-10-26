import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { parseTableParams, isValidTableAccess } from "../../utils/urlParser";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "./LandingPage.css";

// Decorative rising embers configuration (fixed values for consistent rendering)
const EMBERS = [
  { left: "7%", size: 3, delay: 0, duration: 8.5, sway: 20 },
  { left: "16%", size: 2, delay: 3, duration: 11, sway: -18 },
  { left: "28%", size: 4, delay: 5.5, duration: 10, sway: 26 },
  { left: "41%", size: 2, delay: 1.2, duration: 12, sway: -22 },
  { left: "52%", size: 3, delay: 4.2, duration: 9, sway: 15 },
  { left: "64%", size: 2, delay: 6.8, duration: 11.5, sway: -18 },
  { left: "75%", size: 3, delay: 2.1, duration: 10.5, sway: 24 },
  { left: "84%", size: 4, delay: 0.6, duration: 9.8, sway: -20 },
  { left: "93%", size: 2, delay: 3.7, duration: 11.2, sway: 16 },
];

const MARQUEE_ITEMS = [
  "Ember-roasted espresso",
  "Wood-fired plates",
  "Soufflé pancakes all day",
  "Zero-proof coolers",
  "Freshly baked every hour",
  "Pool & Chess lounge",
  "Open till 10 PM",
  "Artisanal Pour Overs",
];

const TABLES_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tables`;

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const introRef = useRef(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [tableModal, setTableModal] = useState(false);
  const [menuTableLink, setMenuTableLink] = useState("");

  // Auto-redirect to active session if returning user
  useEffect(() => {
    const token = localStorage.getItem("yoeg_customer_token");
    if (token) {
      navigate("/order", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    fetch(TABLES_API)
      .then((response) => (response.ok ? response.json() : []))
      .then((tables) => {
        const menuTable = tables.find(
          (table) => table.name?.trim().toLowerCase() === "menu table",
        );

        if (isMounted && menuTable?.number && menuTable?.qrToken) {
          setMenuTableLink(
            `/order?table=${menuTable.number}&token=${encodeURIComponent(menuTable.qrToken)}`,
          );
        }
      })
      .catch(() => {
        // The modal fallback remains available when the menu table cannot be resolved.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return undefined;

    let frameId = 0;
    const updateIntro = () => {
      frameId = 0;
      const bounds = intro.getBoundingClientRect();
      const scrollableDistance = Math.max(bounds.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-bounds.top / scrollableDistance, 0), 1);
      intro.style.setProperty("--intro-progress", progress.toString());
    };
    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateIntro);
    };

    updateIntro();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const handleOrderNow = () => {
    const params = parseTableParams(location.search);
    const validation = isValidTableAccess(params);

    if (validation.valid) {
      navigate(`/order?table=${validation.tableNumber}`);
    } else if (!params.table) {
      // No QR params (direct visit) → show table selector modal
      setTableModal(true);
    } else {
      // Has QR params but they are invalid or table is closed
      setErrorModal({ open: true, message: validation.error });
    }
  };

  const handleExploreMenu = () => {
    if (menuTableLink) {
      navigate(menuTableLink);
      return;
    }

    setTableModal(true);
  };

  const jumpToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      <Navbar />

      {/* Cinematic Hero Section */}
      <section className="hero-section" id="hero">
        {/* Dynamic Drifting Backdrop */}
        <div className="hero-backdrop" aria-hidden="true">
          <div className="hero-drift-orb-1" />
          <div className="hero-drift-orb-2" />
          <div className="hero-drift-orb-3" />
          <div className="hero-grid-pattern" />

          {/* Floating Ember Sparks */}
          {EMBERS.map((ember, i) => (
            <span
              key={i}
              className="hero-ember"
              style={{
                left: ember.left,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                animationDelay: `${ember.delay}s`,
                animationDuration: `${ember.duration}s`,
                "--ember-sway": `${ember.sway}px`,
              }}
            />
          ))}

          <div className="film-grain" />
          <div className="hero-gradient-overlay" />
        </div>

        {/* Hero Content Container */}
        <div className="hero-content-wrap container">
          <div className="hero-main-content animate-rise">
            <p className="hero-eyebrow">
              <span className="eyebrow-line" />
              Est. 2026 · Open Till Late
            </p>

            <h1 className="hero-headline">
              Coffee by day.
              <br />
              <span className="hero-fire">Fire</span> by night.
            </h1>

            <p className="hero-brand-slogan">
              You Only Eat Good..!!!
            </p>

            <p className="hero-subtext">
              Ember-roasted espresso, wood-fired bites and midnight desserts,
              ordered straight from your table.
            </p>

            <div className="hero-action-buttons">
              <button
                className="btn btn-primary btn-lg hero-cta-btn"
                onClick={handleExploreMenu}
              >
                <span>Explore Menu</span>
                <span className="cta-arrow">→</span>
              </button>

              <a href="#our-story" className="btn btn-ghost btn-lg">
                Our Story
              </a>

            </div>

            {/* Live Stats Row */}
            <div className="hero-stats-row">
              <button
                className="hero-stat-item"
                onClick={() => jumpToSection("cafe-interior")}
                type="button"
              >
                <span className="stat-val">
                  4.9 <span className="stat-star">★</span>
                </span>
                <span className="stat-lbl">Guest rating</span>
              </button>
              <div className="hero-stat-sep" />
              <button
                className="hero-stat-item"
                onClick={() => jumpToSection("menu-preview")}
                type="button"
              >
                <span className="stat-val">50+</span>
                <span className="stat-lbl">Handcrafted items</span>
              </button>
              <div className="hero-stat-sep" />
              <button
                className="hero-stat-item"
                onClick={() => jumpToSection("how-it-works")}
                type="button"
              >
                <span className="stat-val">13</span>
                <span className="stat-lbl">Tables & Pool</span>
              </button>
            </div>
          </div>

          {/* Featured Dish Floating Preview Card */}
          <div className="hero-dish-card-col">
            <div className="hero-featured-card card-elevated" onClick={handleOrderNow}>
              <div className="featured-card-badge">Chef's Signature</div>
              <img
                src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800"
                alt="Smoked Honey Latte"
                className="featured-card-img"
              />
              <div className="featured-card-overlay">
                <div className="featured-card-info">
                  <span className="featured-card-name">Smoked Honey Latte</span>
                  <p className="featured-card-desc">Double ristretto, wildflower honey & steamed silky milk</p>
                  <div className="featured-card-price-row">
                    <span className="featured-card-price">₹280.00</span>
                    <span className="featured-card-cta">Order Now →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <section className="marquee-section" aria-hidden="true">
        <div className="marquee-track animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((phrase, idx) => (
            <span key={idx} className="marquee-phrase">
              {phrase}
              <span className="marquee-dot">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Intro Scroll Scene */}
      <section className="intro-section" id="intro" ref={introRef}>
        <div className="intro-sticky">
          <div className="intro-content container">
            <div className="intro-copy">
              <p className="intro-eyebrow">Est. 2026 · Our Story</p>
              <h2 className="intro-title">
                <span className="intro-title-line">
                  <span className="intro-word">Welcome</span>
                  <span className="intro-word">to</span>
                </span>
                <span className="intro-title-line intro-title-accent">
                  <span className="intro-word">Yoeg</span>
                  <span className="intro-word">Cafe</span>
                </span>
              </h2>
              <p className="intro-tagline">You Only Eat Good</p>
            </div>

            <div className="intro-visual">
              <div className="intro-orbit" aria-hidden="true">
                <span />
              </div>
              <div className="intro-glow" aria-hidden="true" />
              <div className="intro-image-wrap">
                <img
                  src="https://res.cloudinary.com/uu1wrvud/image/upload/v1790538745/_Yoeg_cafe__Your_new_favourite_corner_to_relax__connect___create_memories_JPG__1.jpg"
                  alt="Yoeg Cafe interior glowing with warm evening light"
                  className="intro-image"
                />
                <div className="intro-image-shine" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="story-section section" id="our-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-image-col">
              <div className="story-image-card card-elevated">
                <img
                  src="https://res.cloudinary.com/uu1wrvud/image/upload/v1790538745/_Yoeg_cafe__Your_new_favourite_corner_to_relax__connect___create_memories_JPG__1.jpg"
                  alt="Cozy cafe interior with warm lighting"
                  className="story-image"
                />
                <div className="story-image-overlay" aria-hidden="true"></div>
              </div>
              <div className="story-seal" aria-hidden="true">
                <svg viewBox="0 0 200 200" role="presentation">
                  <defs>
                    <path
                      id="story-seal-path"
                      d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"
                    />
                  </defs>
                  <circle cx="100" cy="100" r="98" />
                  <text>
                    <textPath href="#story-seal-path">
                      EST. 2026 · YOU ONLY EAT GOOD ·
                    </textPath>
                  </text>
                  <text x="100" y="113" textAnchor="middle" className="story-seal-mark">
                    Y
                  </text>
                </svg>
              </div>
            </div>

            <div className="story-text-col">
              <div className="section-title text-left">
                <p className="story-eyebrow">
                  <span aria-hidden="true"></span>
                  Chapter one
                </p>
                <h2>
                  Our <em>Story</em>
                </h2>
                <div className="decorative-line" style={{ margin: "var(--space-md) 0 0" }}></div>
              </div>
              <p className="story-text">
                <strong>Yoeg Cafe</strong> was born from a simple belief: that the best moments
                in life happen over a great cup of coffee and great conversation. Nestled in Ranaghat,
                we've been serving handcrafted beverages, wood-fired bites and artisan foods since 2026.
              </p>
              <p className="story-text">
                Every bean is ethically sourced, every dish is prepared fresh to order,
                and every table is designed to feel like home. Whether you're dropping by for a quick espresso,
                challenging a friend to pool, or spending an evening playing card games, we're here to make it memorable.
              </p>
              <div className="story-signature">
                <span className="signature-tagline">"You Only Eat Good..!!!"</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section section" id="how-it-works">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow-accent">Frictionless Experience</p>
            <h2>From Table to Pass in Three Taps</h2>
            <p>No waiting in line. Everything syncs instantly with our kitchen board.</p>
            <div className="decorative-line"></div>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card card card-elevated">
              <div className="step-num-bg">01</div>
              <div className="step-icon">📱</div>
              <h3>1. Scan Table QR</h3>
              <p>
                Scan the secure QR code placed on your table. Your device
                immediately connects to your dining table session.
              </p>
            </div>

            <div className="how-step-card card card-elevated">
              <div className="step-num-bg">02</div>
              <div className="step-icon">🍽️</div>
              <h3>2. Choose & Customise</h3>
              <p>
                Browse dishes, deals & combos. Add special kitchen instructions
                or dietary preferences and add to your order.
              </p>
            </div>

            <div className="how-step-card card card-elevated">
              <div className="step-num-bg">03</div>
              <div className="step-icon">🔥</div>
              <h3>3. Live Kitchen Tracking</h3>
              <p>
                Your order lands directly on our kitchen display. Staff prepare
                and serve it fresh while you relax and play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cafe Interior & Games Lounge */}
      <section className="cafe-interior-section section" id="cafe-interior">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow-accent">Relax & Play</p>
            <h2>Cafe Interior & Games Lounge</h2>
            <p>More than coffee — a social haven with pool, chess, cards, and aesthetic spaces.</p>
            <div className="decorative-line"></div>
          </div>

          <div className="cafe-interior-grid">
            <div className="cafe-interior-card card card-elevated">
              <img
                src="https://res.cloudinary.com/uu1wrvud/image/upload/v1790539773/WhatsApp_Image_2026-09-24_at_5.51.43_PM.jpg"
                alt="Pool Table"
                className="cafe-interior-image"
              />
              <div className="interior-card-caption">
                <h4>8-Ball Pool Table</h4>
                <p>Play friendly matches and tournaments with friends</p>
              </div>
            </div>

            <div className="cafe-interior-card card card-elevated">
              <img
                src="https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&q=80&w=800"
                alt="Chess board setup"
                className="cafe-interior-image"
              />
              <div className="interior-card-caption">
                <h4>Classic Chess Lounge</h4>
                <p>Test your strategy and intellect over hot brew</p>
              </div>
            </div>

            <div className="cafe-interior-card card card-elevated">
              <img
                src="https://thumbs.dreamstime.com/b/pile-uno-cards-table-bend-usa-september-pile-uno-cards-table-126269733.jpg"
                alt="Uno and board games"
                className="cafe-interior-image"
              />
              <div className="interior-card-caption">
                <h4>Card Games & Uno</h4>
                <p>Enjoy vibrant laughs and card deck battles</p>
              </div>
            </div>

            <div className="cafe-interior-card card card-elevated">
              <img
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800"
                alt="Coffee collection"
                className="cafe-interior-image"
              />
              <div className="interior-card-caption">
                <h4>Artisanal Coffee Bar</h4>
                <p>Experience our premium hand-pulled espresso line</p>
              </div>
            </div>

            <div className="cafe-interior-card card card-elevated">
              <img
                src="https://res.cloudinary.com/uu1wrvud/image/upload/v1790538745/_Yoeg_cafe__Your_new_favourite_corner_to_relax__connect___create_memories_JPG__1.jpg"
                alt="Cozy seating"
                className="cafe-interior-image"
              />
              <div className="interior-card-caption">
                <h4>Aesthetic Corners</h4>
                <p>Warm ambient lighting designed to relax & unwind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Preview Carousel */}
      <section className="menu-preview-section section" id="menu-preview">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow-accent">Fresh From The Pass</p>
            <h2>Menu Preview</h2>
            <p>A quick glimpse of our freshly served coffee, coolers and bakes.</p>
            <div className="decorative-line"></div>
          </div>

          <div className="menu-preview-track-container">
            <Swiper
              modules={[Autoplay]}
              spaceBetween={24}
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
                { img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600", title: "Butter Croissant" },
                { img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=600", title: "Blueberry Muffin" },
                { img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=600", title: "Avocado Toast" },
                { img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=600", title: "Iced Caramel Cold Brew" },
                { img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600", title: "Berry Cheesecake" },
              ].map((item, index) => (
                <SwiperSlide key={index} className="menu-preview-slide">
                  <div className="menu-preview-card card-elevated" onClick={handleOrderNow}>
                    <img src={item.img} alt={item.title} className="menu-preview-image" />
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

      {/* Opening Hours & Location Section */}
      <section className="hours-section section" id="hours">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow-accent">Join Us Today</p>
            <h2>Visit Yoeg Cafe</h2>
            <p>We are open every day except Tuesday to give you an unforgettable experience.</p>
            <div className="decorative-line"></div>
          </div>

          <div className="hours-card card card-elevated">
            <div className="hours-grid">
              <div className="hours-block">
                <span className="hours-day-icon">👨‍🍳</span>
                <h4>Wednesday to Monday</h4>
                <p className="hours-time">3:00 PM – 10:00 PM</p>
                <span className="hours-note">Full food & drink menu available</span>
              </div>

              <div className="hours-divider"></div>

              <div className="hours-block">
                <span className="hours-day-icon">😴</span>
                <h4>Tuesday</h4>
                <p className="hours-time">CLOSED</p>
                <span className="hours-note">Kitchen maintenance & team rest day</span>
              </div>
            </div>

            <div className="hours-address-bar">
              <span className="addr-icon">📍</span>
              <span className="addr-text">Ranaghat Biswas Para, Beside Ranaghat Sweets, West Bengal</span>
              <a
                href="https://www.google.com/maps/dir//YOEG+Cafe,+78,+PC+St,+Biswas+Para,+Ranaghat,+West+Bengal+741201/@23.1711712,88.5678907,6826m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x39f8c343f49c40c5:0xbe8ec2ff91079d6c!2m2!1d88.5621072!2d23.1747479?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost"
              >
                Directions ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* QR Code Required Modal (when user clicks Explore Menu without table params) */}
      <Modal
        isOpen={tableModal}
        onClose={() => setTableModal(false)}
        title="Scan Table QR Code"
        size="small"
      >
        <div className="table-selector-content">
          <div className="qr-prompt-icon">📱</div>
          <h4 style={{ marginBottom: "0.5rem", color: "var(--color-white)" }}>Table Access Required</h4>
          <p className="table-selector-desc">
            Please scan the QR code stand on your dining table or counter with your phone's camera.
            Your session will instantly connect to place orders!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setTableModal(false)}
            style={{ marginTop: "var(--space-md)", width: "100%" }}
          >
            I Understand
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        title="Table Verification"
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
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
