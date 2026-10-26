/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTableSocket } from "../../context/TableSocketContext";
import { useMenu } from "../../context/MenuContext";
import { useCart } from "../../context/CartContext";
import Navbar from "../../components/common/Navbar";
import MenuCategory from "../../components/customer/MenuCategory";
import CartSummary from "../../components/customer/CartSummary";
import ComboSection from "../../components/customer/ComboSection";
import ProductDetailModal from "../../components/customer/ProductDetailModal";
import { useCombo } from "../../context/ComboContext";
import { useOrders } from "../../context/OrderContext";
import "./OrderingPage.css";

export default function OrderingPage() {
  const [searchParams] = useSearchParams();
  const urlTableNumber = searchParams.get("table");
  const urlToken = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("all"); // 'all' | 'veg' | 'non-veg'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { menuItems, menuCategories } = useMenu();
  const { combos } = useCombo();
  const { tableNumber, tableName, setTable, addItem } = useCart();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const { isConnected } = useTableSocket();

  // Tables named exactly "Menu Table" are view-only display menus — ordering is disabled.
  const isViewOnly = tableName?.trim().toLowerCase() === "menu table";

  useEffect(() => {
    const sessionToken =
      sessionStorage.getItem("yoeg_customer_token") ||
      localStorage.getItem("yoeg_customer_token");

    if (sessionToken) {
      try {
        const payload = JSON.parse(atob(sessionToken.split(".")[1]));

        fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tables`
        )
          .then((r) => r.json())
          .then((tables) => {
            const t = tables.find((tbl) => tbl.number === payload.tableNumber);
            setTable(payload.tableNumber, t?.name || "");
          })
          .catch(() => setTable(payload.tableNumber, ""));

        if (
          urlTableNumber &&
          parseInt(urlTableNumber, 10) !== payload.tableNumber
        ) {
          navigate("/order", { replace: true });
        } else if (urlToken) {
          navigate("/order", { replace: true });
        }

        setIsVerifying(false);
      } catch {
        sessionStorage.removeItem("yoeg_customer_token");
        verifyNewScan();
      }
    } else {
      verifyNewScan();
    }

    async function verifyNewScan() {
      if (!urlTableNumber || !urlToken) {
        setErrorMsg("Invalid QR Code. Please scan the QR code on your table.");
        setIsVerifying(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tables/validate-qr`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableNumber: urlTableNumber,
              qrToken: urlToken,
            }),
          }
        );

        const data = await res.json();
        if (res.ok) {
          sessionStorage.setItem("yoeg_customer_token", data.token);
          localStorage.setItem("yoeg_customer_token", data.token);
          setTable(parseInt(urlTableNumber, 10), data.table?.name || "");
          navigate("/order", { replace: true });
        } else {
          setErrorMsg(data.message || "Invalid or Expired QR Code.");
        }
      } catch {
        setErrorMsg("Network error verifying QR code.");
      }
      setIsVerifying(false);
    }
  }, [urlTableNumber, urlToken, navigate, setTable]);

  const currentTableOrders = orders.filter(
    (o) => o.tableNumber === parseInt(tableNumber, 10)
  );

  const scrollToCategory = (category) => {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    const el = document.getElementById(`category-${slug}`);
    if (el) {
      const navHeight = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Filter items by search query and dietary filter
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDiet =
        dietaryFilter === "all" ||
        (dietaryFilter === "veg" && item.isVeg) ||
        (dietaryFilter === "non-veg" && !item.isVeg);

      return matchesSearch && matchesDiet;
    });
  }, [menuItems, searchQuery, dietaryFilter]);

  // Categories that have at least one matching item
  const activeCategories = useMemo(() => {
    return menuCategories.filter((cat) =>
      filteredItems.some((item) => item.category === cat)
    );
  }, [menuCategories, filteredItems]);

  const handleModalAddToCart = (item, qty, note) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description,
      qty,
      note,
    });
  };

  if (isVerifying) {
    return (
      <div className="ordering-page">
        <Navbar variant="customer" />
        <div className="no-table-message container">
          <div className="no-table-card card card-elevated">
            <span className="no-table-icon">⏳</span>
            <h2>Securing Connection...</h2>
            <p>Connecting to your table session.</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !tableNumber) {
    return (
      <div className="ordering-page">
        <Navbar variant="customer" />
        <div className="no-table-message container">
          <div className="no-table-card card card-elevated">
            <span className="no-table-icon">🔒</span>
            <h2>{errorMsg || "Please scan a valid table QR code"}</h2>
            <p>Your session could not be established. Please scan the QR code located on your table stand.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/")}
              style={{ marginTop: "var(--space-md)" }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ordering-page">
      <Navbar variant="customer" tableNumber={tableNumber} tableName={tableName} />

      {/* Connection Status Indicator */}
      <div
        className={`connection-status ${isConnected ? "connected" : "disconnected"}`}
        title={isConnected ? "Live Connection" : "Connecting to Kitchen…"}
      >
        <span className="status-dot"></span>
      </div>

      {/* Sticky Category Nav */}
      <div className="category-nav glass" id="category-nav">
        {/* Search and Filters Header */}
        <div className="menu-filter-bar">
          <div className="container filter-bar-inner">
            {/* Search Input */}
            <div className="menu-search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search espresso, pizza, burgers, coolers..."
                className="menu-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dietary Filter Tabs */}
            <div className="dietary-filter-pills">
              <button
                className={`diet-pill ${dietaryFilter === "all" ? "active" : ""}`}
                onClick={() => setDietaryFilter("all")}
              >
                All Items
              </button>
              <button
                className={`diet-pill ${dietaryFilter === "veg" ? "active" : ""}`}
                onClick={() => setDietaryFilter("veg")}
              >
                <span className="veg-dot-pill" /> Veg
              </button>
              <button
                className={`diet-pill ${dietaryFilter === "non-veg" ? "active" : ""}`}
                onClick={() => setDietaryFilter("non-veg")}
              >
                <span className="non-veg-dot-pill" /> Non-Veg
              </button>
            </div>
          </div>
        </div>

        <div className="category-nav-inner container">
          {/* Combos pill */}
          {!isViewOnly && combos.length > 0 && !searchQuery && dietaryFilter === "all" && (
            <button
              className="category-pill"
              onClick={() => scrollToCategory("combos")}
            >
              🔥 Combos & Deals
            </button>
          )}

          {activeCategories.map((cat) => (
            <button
              key={cat}
              className="category-pill"
              onClick={() => scrollToCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* View-only banner for Menu Table */}
      {isViewOnly && (
        <div className="view-only-banner container">
          <span>📋</span>
          <span>This is a <strong>display menu</strong> — ordering is not available at this table.</span>
        </div>
      )}

      {/* Filter Results Summary (when searching or filtered) */}
      {(searchQuery || dietaryFilter !== "all") && (
        <div className="filter-summary-bar container">
          <span>
            Found <strong>{filteredItems.length}</strong> matching dish{filteredItems.length !== 1 ? "es" : ""}
          </span>
          <button
            className="filter-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setDietaryFilter("all");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Top-featured Combos & Deals (only when not searching/filtering) */}
      {!isViewOnly && !searchQuery && dietaryFilter === "all" && (
        <ComboSection viewOnly={false} />
      )}

      {/* Current Orders Section — active placed orders */}
      {!isViewOnly && currentTableOrders.length > 0 && (
        <div className="current-orders-section container animate-slideDown">
          <div className="current-orders-header">
            <h3>Active Table Orders</h3>
            <span className="badge badge-primary">Sent to Kitchen</span>
          </div>
          <div className="current-orders-list">
            {currentTableOrders.map((order) => (
              <div key={order.id} className="current-order-card card">
                <div className="current-order-card-header">
                  <span className="order-id">Order #{order.id}</span>
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
                <div className="current-order-card-footer">
                  <span className="order-total">
                    Total: <strong>₹{order.total}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Categories and Product Grid */}
      <main className="ordering-main container">
        {filteredItems.length === 0 ? (
          <div className="empty-catalog-card card card-elevated">
            <span className="empty-catalog-icon">🍽️</span>
            <h3>No matching dishes found</h3>
            <p>Try modifying your search or clearing dietary filters.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSearchQuery("");
                setDietaryFilter("all");
              }}
              style={{ marginTop: "var(--space-md)" }}
            >
              View Full Menu
            </button>
          </div>
        ) : (
          activeCategories.map((category) => {
            const categoryItems = filteredItems.filter(
              (item) => item.category === category
            );
            return (
              <MenuCategory
                key={category}
                category={category}
                items={categoryItems}
                viewOnly={isViewOnly}
                onOpenDetails={(item) => setSelectedProduct(item)}
              />
            );
          })
        )}
      </main>

      {/* Product Detail Sheet Modal */}
      <ProductDetailModal
        item={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleModalAddToCart}
        viewOnly={isViewOnly}
      />

      {/* Bottom Cart Summary Bar */}
      {!isViewOnly && <CartSummary />}

      {/* Spacer so bottom items aren't hidden behind the floating cart */}
      <div className="cart-spacer"></div>
    </div>
  );
}
