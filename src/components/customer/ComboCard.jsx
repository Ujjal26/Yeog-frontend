import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import './ComboCard.css';

/**
 * ComboCard
 * Displays a combo deal with its constituent items, original/combo pricing,
 * savings badge, veg indicator, and add-to-cart controls.
 *
 * @param {Object} combo - Enriched combo object from ComboContext (includes
 *   originalPrice, savings, isVeg, dynamicAvailability, comboItems).
 * @param {boolean} viewOnly - When true, hides all ordering controls.
 */
export default function ComboCard({ combo, viewOnly = false }) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const cartItem = items.find((i) => i.id === combo._id || i.id === combo.id);
  const qty = cartItem ? cartItem.qty : 0;

  const isAvailable = combo.dynamicAvailability ?? combo.isAvailable;

  const handleAdd = () => {
    // Build the comboItems breakdown for kitchen display and checkout
    const comboItems = (combo.items || [])
      .filter((ci) => ci.item != null)
      .map((ci) => ({
        id: ci.item._id || ci.item.id,
        name: ci.item.name,
        qty: ci.quantity || 1,
        isVeg: ci.item.isVeg,
        description: ci.item.description || '',
        price: ci.item.price || 0,
      }));

    addItem({
      id: combo.id || combo._id,
      name: combo.name,
      description: combo.description || '',
      price: combo.comboPrice,
      image: combo.image,
      isCombo: true,
      comboItems,
    });
  };

  const handleIncrement = () => updateQuantity(combo.id || combo._id, qty + 1);
  const handleDecrement = () => {
    if (qty <= 1) removeItem(combo.id || combo._id);
    else updateQuantity(combo.id || combo._id, qty - 1);
  };

  const validItems = (combo.items || []).filter((ci) => ci.item != null);
  const savingsPercent =
    combo.originalPrice > 0
      ? Math.round((combo.savings / combo.originalPrice) * 100)
      : 0;

  return (
    <div className={`combo-card ${!isAvailable ? 'combo-sold-out' : ''}`} id={`combo-${combo.id || combo._id}`}>
      {/* Savings Badge */}
      {combo.savings > 0 && isAvailable && (
        <div className="combo-savings-badge">
          Save {formatPrice(combo.savings)}
          {savingsPercent > 0 && <span className="combo-savings-pct"> · {savingsPercent}% off</span>}
        </div>
      )}

      {/* Image */}
      <div className="combo-image-wrap">
        <span className={`veg-badge ${combo.isVeg ? 'veg' : 'non-veg'}`}>
          <span className="veg-badge-dot" />
        </span>
        <img
          src={combo.image}
          alt={combo.name}
          className={`combo-image ${imageLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        {!isAvailable && (
          <div className="sold-out-overlay">
            <span className="badge badge-error">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="combo-info">
        <h4 className="combo-name">{combo.name}</h4>
        <p className="combo-desc">{combo.description}</p>

        {/* Constituent item chips */}
        {validItems.length > 0 && (
          <div className="combo-item-chips">
            {validItems.map((ci, idx) => (
              <span key={idx} className="combo-chip">
                {ci.item.name}
                {ci.quantity > 1 && ` ×${ci.quantity}`}
              </span>
            ))}
          </div>
        )}

        {/* Pricing + Controls */}
        <div className="combo-footer">
          <div className="combo-pricing">
            {combo.originalPrice > combo.comboPrice && (
              <span className="combo-original-price">{formatPrice(combo.originalPrice)}</span>
            )}
            <span className="combo-price">{formatPrice(combo.comboPrice)}</span>
          </div>

          {viewOnly ? (
            <span className="combo-viewonly-label">view only</span>
          ) : isAvailable ? (
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
            <button className="btn btn-sm add-btn" disabled>Unavailable</button>
          )}
        </div>
      </div>
    </div>
  );
}
