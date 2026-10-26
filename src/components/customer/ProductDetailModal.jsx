import { useState, useEffect } from "react";
import { formatPrice } from "../../utils/helpers";
import "./ProductDetailModal.css";

/**
 * ProductDetailContent
 * Keyed by item.id so state automatically resets cleanly when switching dishes.
 */
function ProductDetailContent({ item, onClose, onAddToCart, viewOnly }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const lineTotal = (item.price || 0) * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (viewOnly || !item.isAvailable) return;
    onAddToCart(item, quantity, note.trim());
    onClose();
  };

  return (
    <div
      className="product-modal-sheet card-elevated"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button */}
      <button
        type="button"
        className="product-modal-close"
        onClick={onClose}
        aria-label="Close dish preview"
      >
        ✕
      </button>

      {/* Hero Image Section */}
      <div className="product-modal-image-wrap">
        <img
          src={item.image}
          alt={item.name}
          className="product-modal-image"
        />
        <div className="product-modal-image-overlay" />
        <span className={`product-modal-veg ${item.isVeg ? "veg" : "non-veg"}`}>
          <span className="product-modal-veg-dot" />
          {item.isVeg ? "VEG" : "NON-VEG"}
        </span>
        {!item.isAvailable && (
          <div className="product-modal-sold-out">
            <span>Sold Out</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <form onSubmit={handleSubmit} className="product-modal-content">
        <div className="product-modal-body">
          {/* Meta Row */}
          <div className="product-modal-meta">
            <span className="product-modal-rating">
              ★ 4.9 <span className="meta-reviews">(120+ reviews)</span>
            </span>
            <span className="product-modal-prep">⏱ 8–12 mins</span>
            <span className="product-modal-fresh">🌿 Freshly Prepared</span>
          </div>

          {/* Title & Price */}
          <h2 className="product-modal-title">{item.name}</h2>
          <div className="product-modal-price-tag">{formatPrice(item.price)}</div>

          {/* Description */}
          <p className="product-modal-desc">
            {item.description || "Handcrafted with the finest ingredients, made fresh to order in our kitchen."}
          </p>

          {/* Special Instructions (Notes) */}
          {!viewOnly && item.isAvailable && (
            <div className="product-modal-notes-section">
              <label htmlFor="dish-note" className="notes-label">
                Special Instructions
                <span className="notes-optional">(optional)</span>
              </label>
              <textarea
                id="dish-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 150))}
                placeholder="Allergies, extra spicy, less ice, no onions..."
                rows={2}
                className="notes-textarea input"
              />
              <span className="notes-char-count">{note.length}/150</span>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="product-modal-footer">
          {viewOnly ? (
            <div className="view-only-footer-note">
              📋 Display Menu — ordering is not active at this table.
            </div>
          ) : item.isAvailable ? (
            <div className="product-modal-actions">
              {/* Quantity Stepper */}
              <div className="modal-stepper">
                <button
                  type="button"
                  className="modal-stepper-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="modal-stepper-val">{quantity}</span>
                <button
                  type="button"
                  className="modal-stepper-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <button type="submit" className="btn btn-primary modal-add-btn">
                <span>Add to Order</span>
                <span className="modal-btn-price">{formatPrice(lineTotal)}</span>
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary modal-add-btn" disabled>
              Currently Sold Out
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * ProductDetailModal
 * Cinematic product sheet dialog inspired by yoegcafe's product-sheet.
 */
export default function ProductDetailModal({ item, isOpen, onClose, onAddToCart, viewOnly = false }) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="product-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <ProductDetailContent
        key={item.id}
        item={item}
        onClose={onClose}
        onAddToCart={onAddToCart}
        viewOnly={viewOnly}
      />
    </div>
  );
}
