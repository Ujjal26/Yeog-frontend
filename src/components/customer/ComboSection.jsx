import { useEffect } from 'react';
import { useCombo } from '../../context/ComboContext';
import { useTableSocket } from '../../context/TableSocketContext';
import ComboCard from './ComboCard';
import './ComboSection.css';

/**
 * ComboSection
 * Top-featured horizontally scrollable section showing active combo deals.
 * Listens for `combo_updated` socket events and re-fetches automatically.
 * Hidden entirely when there are no available combos or in viewOnly mode.
 *
 * @param {boolean} viewOnly - Passed down to ComboCard to hide ordering controls.
 */
export default function ComboSection({ viewOnly = false }) {
  const { combos, fetchCombos } = useCombo();
  const { socket } = useTableSocket();

  // Re-fetch combos when the socket notifies of a change (admin created/edited/deleted one)
  useEffect(() => {
    if (!socket) return;
    const handleComboUpdated = () => fetchCombos();
    socket.on('combo_updated', handleComboUpdated);
    return () => socket.off('combo_updated', handleComboUpdated);
  }, [socket, fetchCombos]);

  // In view-only mode or if there are no combos at all, don't render
  if (viewOnly || combos.length === 0) return null;

  return (
    <section className="combo-section container" id="category-combos">
      {/* Section Header */}
      <div className="combo-section-header">
        <div className="combo-section-title-wrap">
          <span className="combo-fire-icon">🔥</span>
          <div>
            <h2 className="combo-section-title">Combos &amp; Deals</h2>
            <p className="combo-section-subtitle">Save more, enjoy more</p>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="combo-scroll-track">
        {combos.map((combo) => (
          <ComboCard key={combo.id || combo._id} combo={combo} viewOnly={viewOnly} />
        ))}
      </div>
    </section>
  );
}
