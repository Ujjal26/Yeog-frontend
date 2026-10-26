import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import './ProductCard.css';

export default function ProductCard({ item, viewOnly = false, onOpenDetails }) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description,
    });
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(item.id, qty + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (qty <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, qty - 1);
    }
  };

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails(item);
    }
  };

  return (
    <article
      className={`product-card card ${!item.isAvailable ? 'sold-out' : ''}`}
      id={`product-${item.id}`}
      onClick={handleCardClick}
      style={{ cursor: onOpenDetails ? 'pointer' : 'default' }}
    >
      <div className="product-image-wrap">
        <span className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`} title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}>
          <span className="veg-badge-dot" />
        </span>

        {/* Rating overlay pill */}
        <span className="product-rating-badge">★ 4.9</span>

        <img
          src={item.image}
          alt={item.name}
          className={`product-image ${imageLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        <div className="product-image-gradient" />

        {!item.isAvailable && (
          <div className="sold-out-overlay">
            <span className="badge badge-error">Sold Out</span>
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-header-row">
          <h4 className="product-name">{item.name}</h4>
          <span className="product-prep-tag">10m</span>
        </div>
        <p className="product-desc">{item.description}</p>
        <div className="product-footer" onClick={(e) => e.stopPropagation()}>
          <span className="product-price">{formatPrice(item.price)}</span>

          {/* View-only mode: hide all ordering controls */}
          {viewOnly ? (
            <span className="product-viewonly-label">
              view only
            </span>
          ) : item.isAvailable ? (
            qty > 0 ? (
              <div className="qty-controls">
                <button className="qty-btn" onClick={handleDecrement} aria-label="Decrease quantity">−</button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={handleIncrement} aria-label="Increase quantity">+</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm add-btn" onClick={handleAdd}>
                Add +
              </button>
            )
          ) : (
            <button className="btn btn-sm add-btn" disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
