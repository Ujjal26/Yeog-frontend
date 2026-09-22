import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ variant = "customer", tableNumber, tableName }) {
  const location = useLocation();

  const adminLinks = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/orders", label: "Live Orders", icon: "🔥" },
    { path: "/admin/menu", label: "Menu Editor", icon: "📝" },
  ];

  return (
    <nav
      className={`navbar glass ${variant === "admin" ? "navbar-admin" : ""}`}
      id="main-navbar"
    >
      <div className="navbar-inner">
        <Link to={variant === "admin" ? "/admin" : "/"} className="navbar-logo">
          {/* <span className="logo-icon">☕</span> */}
          <span className="logo-text">yoeg cafe</span>
        </Link>

        <div>
          <p className="footer-address">📍 Ranaghat Biswas Para, Beside Ranaghat Sweets</p>
        </div>

        {variant === "customer" && tableNumber && (
          <div className="table-indicator">
            <span className="table-dot"></span>
            {tableName || `Table ${tableNumber}`}
          </div>
        )}

        {variant === "admin" && (
          <div className="navbar-links">
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
          </div>
        )}
      </div>
    </nav>
  );
}
