import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ChangePasswordModal from "../admin/ChangePasswordModal";
import "./Navbar.css";

export default function Navbar({ variant = "customer", tableNumber, tableName }) {
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const adminLinks = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/orders", label: "Live Orders", icon: "🔥" },
    { path: "/admin/menu", label: "Menu Editor", icon: "📝" },
    { path: "/admin/tables", label: "Tables", icon: "🪑" },
    { path: "/admin/combos", label: "Combos & Deals", icon: "🎁" },
    { path: "/admin/analytics", label: "Sales Analytics", icon: "📈" },
  ];

  return (
    <nav
      className={`navbar glass ${variant === "admin" ? "navbar-admin" : ""}`}
      id="main-navbar"
    >
      <div className="navbar-inner">
        <Link to={variant === "admin" ? "/admin" : "/"} className="navbar-logo">
          <span className="logo-spark">✦</span>
          <span className="logo-brand">
            <span className="logo-yoeg">yoeg</span>
            <span className="logo-cafe">cafe</span>
          </span>
        </Link>

        <div className="navbar-center-info">
          <p className="footer-address">📍 Ranaghat Biswas Para, Beside Ranaghat Sweets</p>
        </div>

        {variant === "customer" && tableNumber && (
          <div className="table-indicator">
            <span className="table-dot"></span>
            <span className="table-label">{tableName || `Table ${tableNumber}`}</span>
          </div>
        )}

        {variant === "admin" && (
          <>
            <div className="navbar-links">
              {adminLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${
                    location.pathname === link.path ? "active" : ""
                  }`}
                  aria-label={link.label}
                  title={link.label}
                >
                  <span className="link-icon">{link.icon}</span>
                  <span className="link-label">{link.label}</span>
                </Link>
              ))}
            </div>

            <details className="navbar-links-dropdown">
              <summary aria-label="Open admin navigation">
                <span className="link-icon">☰</span>
                <span className="link-label">Menu</span>
              </summary>
              <div className="navbar-dropdown-menu">
                {adminLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`navbar-link ${
                      location.pathname === link.path ? "active" : ""
                    }`}
                  >
                    <span className="link-icon">{link.icon}</span>
                    <span className="link-label">{link.label}</span>
                  </Link>
                ))}
                <button
                  type="button"
                  className="navbar-link navbar-dropdown-action"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <span className="link-icon">🔑</span>
                  <span className="link-label">Change Password</span>
                </button>
              </div>
            </details>

            <ChangePasswordModal
              isOpen={isPasswordModalOpen}
              onClose={() => setIsPasswordModalOpen(false)}
            />
          </>
        )}
      </div>
    </nav>
  );
}
