import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import './ProductCard.css';

export default function ProductCard({ item }) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  };

  const handleIncrement = () => {
    updateQuantity(item.id, qty + 1);
  };

  const handleDecrement = () => {
    if (qty <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, qty - 1);
    }
  };

  return (
    <div className={`product-card card ${!item.isAvailable ? 'sold-out' : ''}`} id={`product-${item.id}`}>
      <div className="product-image-wrap">
        <img
          src={item.image}
          alt={item.name}
          className={`product-image ${imageLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        {!item.isAvailable && (
          <div className="sold-out-overlay">
            <span className="badge badge-error">Sold Out</span>
          </div>
        )}
      </div>

      <div className="product-info">
        <h4 className="product-name">{item.name}</h4>
        <p className="product-desc">{item.description}</p>
        <div className="product-footer">
          <span className="product-price">{formatPrice(item.price)}</span>

          {item.isAvailable ? (
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
    </div>
  );
}
