/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { useCombo } from '../../context/ComboContext';
import { useMenu } from '../../context/MenuContext';
import { formatPrice } from '../../utils/helpers';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import Modal from '../../components/common/Modal';
import './ComboEditorPage.css';

export default function ComboEditorPage() {
  const { combos, fetchCombos, addCombo, updateCombo, deleteCombo, toggleComboAvailability } = useCombo();
  const { menuItems } = useMenu();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, combo: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, combo: null });

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [{ item: ObjectId/id, quantity: 1 }]
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [itemPickerSearch, setItemPickerSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all combos (including admin-disabled) on mount
  useEffect(() => {
    fetchCombos({ all: true });
  }, [fetchCombos]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveExistingImage(false);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setComboPrice('');
    setSelectedItems([]);
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    setItemPickerSearch('');
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (combo) => {
    resetForm();
    setName(combo.name || '');
    setDescription(combo.description || '');
    setComboPrice(combo.comboPrice != null ? String(combo.comboPrice) : '');
    
    // Normalize items array
    const mapped = (combo.items || []).map((ci) => {
      const itemId = ci.item?._id || ci.item?.id || ci.item;
      return {
        item: itemId,
        quantity: ci.quantity || 1,
      };
    });
    setSelectedItems(mapped);

    if (combo.image) {
      setImagePreview(combo.image);
    }

    setEditModal({ open: true, combo });
  };

  // Upload image helper (Cloudinary)
  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('photo', imageFile);

    const token = sessionStorage.getItem('yoeg_admin_token');
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.imageUrl;
  };

  // Add / remove items in the combo form
  const handleAddItemToCombo = (menuItem) => {
    const itemId = menuItem._id || menuItem.id;
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.item === itemId);
      if (existing) {
        return prev.map((i) =>
          i.item === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item: itemId, quantity: 1 }];
    });
  };

  const handleUpdateItemQuantity = (itemId, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.item === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItemFromCombo = (itemId) => {
    setSelectedItems((prev) => prev.filter((i) => i.item !== itemId));
  };

  // Live calculation of original price & diet for current modal form
  const currentFormCalculations = useMemo(() => {
    let originalTotal = 0;
    let isAllVeg = selectedItems.length > 0;
    let firstItemImage = null;

    selectedItems.forEach((si, idx) => {
      const match = menuItems.find((m) => (m._id || m.id) === si.item);
      if (match) {
        originalTotal += (match.price || 0) * si.quantity;
        if (!match.isVeg) isAllVeg = false;
        if (idx === 0 && match.image) firstItemImage = match.image;
      }
    });

    const parsedPrice = parseFloat(comboPrice) || 0;
    const liveSavings = Math.max(0, originalTotal - parsedPrice);
    const savingsPercent =
      originalTotal > 0 && parsedPrice > 0
        ? Math.round(((originalTotal - parsedPrice) / originalTotal) * 100)
        : 0;

    return {
      originalTotal,
      liveSavings,
      savingsPercent,
      isAllVeg,
      firstItemImage,
    };
  }, [selectedItems, comboPrice, menuItems]);

  // Submit Add
  const handleAddSubmit = async () => {
    try {
      if (!name.trim()) return setFormError('Combo name is required');
      if (!description.trim()) return setFormError('Description is required');
      if (selectedItems.length === 0) return setFormError('Please select at least 1 menu item for the combo');
      if (!comboPrice || isNaN(comboPrice) || Number(comboPrice) <= 0) {
        return setFormError('Please enter a valid combo price');
      }

      setIsSubmitting(true);
      setFormError('');

      let customImageUrl = null;
      if (imageFile) {
        customImageUrl = await uploadImage();
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: customImageUrl, // null means use item fallback
        items: selectedItems,
        comboPrice: Number(comboPrice),
      };

      const res = await addCombo(payload);
      if (res.success) {
        setIsAddModalOpen(false);
        resetForm();
      } else {
        setFormError(res.error || 'Failed to add combo');
      }
    } catch (err) {
      setFormError(err.message || 'Error saving combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async () => {
    try {
      if (!name.trim()) return setFormError('Combo name is required');
      if (!description.trim()) return setFormError('Description is required');
      if (selectedItems.length === 0) return setFormError('Please select at least 1 menu item for the combo');
      if (!comboPrice || isNaN(comboPrice) || Number(comboPrice) <= 0) {
        return setFormError('Please enter a valid combo price');
      }

      setIsSubmitting(true);
      setFormError('');

      let customImageUrl = editModal.combo.image;
      if (removeExistingImage) {
        customImageUrl = null;
      } else if (imageFile) {
        customImageUrl = await uploadImage();
      }

      const updates = {
        name: name.trim(),
        description: description.trim(),
        image: customImageUrl,
        items: selectedItems,
        comboPrice: Number(comboPrice),
      };

      const res = await updateCombo(editModal.combo.id, updates);
      if (res.success) {
        setEditModal({ open: false, combo: null });
        resetForm();
      } else {
        setFormError(res.error || 'Failed to update combo');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteModal.combo) return;
    setIsSubmitting(true);
    await deleteCombo(deleteModal.combo.id);
    setIsSubmitting(false);
    setDeleteModal({ open: false, combo: null });
  };

  // Filtered Combos List for Table
  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      // Status filter
      if (statusFilter === 'active' && !c.isAvailable) return false;
      if (statusFilter === 'inactive' && c.isAvailable) return false;

      // Query filter (matches combo name, description, or constituent item names)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const itemMatch = (c.items || []).some((ci) =>
          ci.item?.name?.toLowerCase().includes(q)
        );
        return nameMatch || descMatch || itemMatch;
      }
      return true;
    });
  }, [combos, statusFilter, searchQuery]);

  // Available menu items list for picker modal (filtered by search)
  const filteredPickerItems = useMemo(() => {
    if (!itemPickerSearch.trim()) return menuItems;
    const q = itemPickerSearch.toLowerCase();
    return menuItems.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
    );
  }, [menuItems, itemPickerSearch]);

  return (
    <div className="admin-page">
      <div className="admin-mobile-nav">
        <Navbar variant="admin" />
      </div>

      <div className="admin-layout">
        <Sidebar />

        <main className="admin-main">
          {/* Header */}
          <div className="admin-header animate-slideDown" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem' }}>🎁</span>
                <h1 style={{ margin: 0 }}>Combos & Deals</h1>
              </div>
              <p style={{ marginTop: '4px' }}>
                Bundle existing dishes into high-value combo offers for your customers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="badge badge-primary badge-dot">
                {combos.filter((c) => c.isAvailable).length} active / {combos.length} total
              </span>
              <button className="btn btn-primary" onClick={handleOpenAdd}>
                + Create Combo
              </button>
            </div>
          </div>

          {/* Controls: Search and Filter Tabs */}
          <div className="combo-controls-bar animate-slideUp">
            <div className="editor-tabs" style={{ marginBottom: 0 }}>
              <button
                className={`editor-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Combos ({combos.length})
              </button>
              <button
                className={`editor-tab ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Active ({combos.filter((c) => c.isAvailable).length})
              </button>
              <button
                className={`editor-tab ${statusFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                Disabled ({combos.filter((c) => !c.isAvailable).length})
              </button>
            </div>

            <div className="combo-search-wrap">
              <input
                type="text"
                className="input"
                placeholder="Search combos or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', maxWidth: '320px' }}
              />
            </div>
          </div>

          {/* Combos Table */}
          <div className="menu-table-wrap card animate-slideUp stagger-2" style={{ marginTop: '1rem' }}>
            <table className="menu-table" id="combos-editor-table">
              <thead>
                <tr>
                  <th>Deal Offer</th>
                  <th>Constituent Items</th>
                  <th>Original</th>
                  <th>Deal Price</th>
                  <th>Savings</th>
                  <th>Diet</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCombos.map((combo) => {
                  const hasOutOfStockItem =
                    combo.isAvailable && !combo.dynamicAvailability;

                  return (
                    <tr
                      key={combo.id}
                      className={!combo.isAvailable ? 'row-unavailable' : ''}
                    >
                      {/* Deal Offer (Thumb + Name + Desc) */}
                      <td>
                        <div className="table-item-cell">
                          {combo.image ? (
                            <img
                              src={combo.image}
                              alt={combo.name}
                              className="table-item-thumb combo-thumb"
                            />
                          ) : (
                            <div className="combo-thumb-placeholder">
                              🎁
                            </div>
                          )}
                          <div className="table-item-info">
                            <span className="table-item-name">{combo.name}</span>
                            <span className="table-item-desc">{combo.description}</span>
                          </div>
                        </div>
                      </td>

                      {/* Constituent Items */}
                      <td>
                        <div className="combo-items-cell">
                          {(combo.items || []).map((ci, idx) => (
                            <span key={idx} className="combo-item-chip">
                              <span className="combo-item-chip-qty">
                                {ci.quantity}×
                              </span>{' '}
                              {ci.item?.name || 'Item'}
                              {ci.item && !ci.item.isAvailable && (
                                <span className="combo-item-chip-alert" title="Item currently out of stock in menu">
                                  (Out of stock)
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Original Price */}
                      <td className="table-price" style={{ textDecoration: 'line-through', opacity: 0.65 }}>
                        {formatPrice(combo.originalPrice || 0)}
                      </td>

                      {/* Combo Price */}
                      <td className="table-price" style={{ color: 'var(--color-accent-light)', fontWeight: 700 }}>
                        {formatPrice(combo.comboPrice)}
                      </td>

                      {/* Savings */}
                      <td>
                        {combo.savings > 0 ? (
                          <span className="badge badge-success" style={{ fontWeight: 600 }}>
                            Save {formatPrice(combo.savings)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>—</span>
                        )}
                      </td>

                      {/* Diet */}
                      <td>
                        <span className={`veg-tag ${combo.isVeg ? 'veg' : 'non-veg'}`}>
                          <span className="veg-tag-dot" />
                          {combo.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>

                      {/* Availability Toggle */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label className="toggle-switch" id={`toggle-combo-${combo.id}`}>
                            <input
                              type="checkbox"
                              checked={combo.isAvailable}
                              onChange={() => toggleComboAvailability(combo.id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          {hasOutOfStockItem && (
                            <span className="combo-warning-badge" title="Disabled because 1 or more dishes inside are out of stock">
                              ⚠️ Item out of stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleOpenEdit(combo)}
                            aria-label={`Edit ${combo.name}`}
                            title="Edit combo"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => setDeleteModal({ open: true, combo })}
                            aria-label={`Delete ${combo.name}`}
                            title="Delete combo"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCombos.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎁</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                        No combos found
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.45)', margin: '4px 0 16px' }}>
                        Create your first bundle offer using the button above.
                      </p>
                      <button className="btn btn-sm btn-primary" onClick={handleOpenAdd}>
                        + Create Combo Now
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add / Edit Combo Modal */}
      <Modal
        isOpen={isAddModalOpen || editModal.open}
        onClose={() => {
          if (!isSubmitting) {
            setIsAddModalOpen(false);
            setEditModal({ open: false, combo: null });
          }
        }}
        title={isAddModalOpen ? 'Create New Combo Deal' : 'Edit Combo Deal'}
      >
        <div className="combo-form-wrap">
          {formError && (
            <div className="combo-form-error animate-shake">
              ⚠️ {formError}
            </div>
          )}

          {/* Name & Combo Price */}
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Combo Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Burger & Shake Duo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="form-label">Combo Price (₹) *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 299"
                value={comboPrice}
                onChange={(e) => setComboPrice(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Marketing Description *</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Classic veg burger with crispy fries and a chilled shake."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Item Selector Section */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Included Items ({selectedItems.length}) *</span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                Pick from existing menu
              </span>
            </label>

            {/* Selected items list */}
            {selectedItems.length > 0 ? (
              <div className="selected-items-box">
                {selectedItems.map((si) => {
                  const itemDoc = menuItems.find(
                    (m) => (m._id || m.id) === si.item
                  );
                  return (
                    <div key={si.item} className="selected-item-row">
                      <div className="selected-item-info">
                        <span className={`veg-dot-inline ${itemDoc?.isVeg ? 'veg' : 'non-veg'}`} />
                        <span className="selected-item-name">
                          {itemDoc?.name || 'Selected Item'}
                        </span>
                        <span className="selected-item-price">
                          {formatPrice(itemDoc?.price || 0)} ea
                        </span>
                      </div>

                      <div className="selected-item-controls">
                        <div className="qty-control-inline">
                          <button
                            type="button"
                            className="qty-btn-inline"
                            onClick={() => handleUpdateItemQuantity(si.item, -1)}
                            disabled={isSubmitting}
                          >
                            −
                          </button>
                          <span className="qty-num-inline">{si.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn-inline"
                            onClick={() => handleUpdateItemQuantity(si.item, 1)}
                            disabled={isSubmitting}
                          >
                            +
                          </button>
                        </div>
                        <span className="selected-item-subtotal">
                          {formatPrice((itemDoc?.price || 0) * si.quantity)}
                        </span>
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => handleRemoveItemFromCombo(si.item)}
                          disabled={isSubmitting}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-items-picker-hint">
                No items added yet. Click items below to add them to this deal bundle.
              </div>
            )}

            {/* Menu Item Quick Picker */}
            <div className="item-picker-container">
              <input
                type="text"
                className="input input-sm"
                placeholder="Search menu to add dish..."
                value={itemPickerSearch}
                onChange={(e) => setItemPickerSearch(e.target.value)}
                disabled={isSubmitting}
                style={{ marginBottom: '8px' }}
              />
              <div className="item-picker-chips-grid">
                {filteredPickerItems.map((m) => {
                  const itemId = m._id || m.id;
                  const isAlreadySelected = selectedItems.some(
                    (i) => i.item === itemId
                  );
                  return (
                    <button
                      key={itemId}
                      type="button"
                      className={`picker-chip ${isAlreadySelected ? 'picked' : ''}`}
                      onClick={() => handleAddItemToCombo(m)}
                      disabled={isSubmitting}
                    >
                      <span className={`veg-dot-inline ${m.isVeg ? 'veg' : 'non-veg'}`} />
                      <span className="picker-chip-name">{m.name}</span>
                      <span className="picker-chip-price">{formatPrice(m.price)}</span>
                      {isAlreadySelected && <span className="picker-chip-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Pricing Breakdown Card */}
          <div className="combo-pricing-summary card">
            <div className="summary-row">
              <span>Original Value (Sum of dishes):</span>
              <span className="summary-val">
                {formatPrice(currentFormCalculations.originalTotal)}
              </span>
            </div>
            <div className="summary-row">
              <span>Customer Pays:</span>
              <span className="summary-val highlight">
                {comboPrice ? formatPrice(Number(comboPrice)) : '₹0'}
              </span>
            </div>
            <div className="summary-row savings-row">
              <span>Customer Saves:</span>
              <span className="summary-val savings">
                {currentFormCalculations.liveSavings > 0
                  ? `${formatPrice(currentFormCalculations.liveSavings)} (${currentFormCalculations.savingsPercent}% OFF)`
                  : '₹0 (0% OFF)'}
              </span>
            </div>
            <div className="summary-row" style={{ fontSize: '0.8rem', opacity: 0.8, borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '6px' }}>
              <span>Diet Classification:</span>
              <span>
                {currentFormCalculations.isAllVeg
                  ? '🟢 100% Vegetarian'
                  : '🔴 Contains Non-Veg items'}
              </span>
            </div>
          </div>

          {/* Image Upload (Optional) */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">
              Combo Image <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Optional</span>
            </label>
            <p className="form-hint">
              By default, the photo of the first selected dish ({currentFormCalculations.firstItemImage ? 'ready' : 'select an item above'}) will be used. You can upload a custom deal promotional banner if you wish.
            </p>

            <div className="combo-image-row">
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              {(imagePreview || (!removeExistingImage && editModal.combo?.image)) && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={handleClearCustomImage}
                  disabled={isSubmitting}
                >
                  Clear custom image
                </button>
              )}
            </div>

            {/* Preview image */}
            <div className="combo-preview-container">
              {imagePreview ? (
                <div className="combo-preview-card">
                  <img src={imagePreview} alt="Custom Preview" className="combo-preview-img" />
                  <span className="combo-preview-label">Custom Banner</span>
                </div>
              ) : currentFormCalculations.firstItemImage ? (
                <div className="combo-preview-card fallback">
                  <img
                    src={currentFormCalculations.firstItemImage}
                    alt="Item Fallback Preview"
                    className="combo-preview-img"
                  />
                  <span className="combo-preview-label">Auto Fallback (First Item)</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditModal({ open: false, combo: null });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={isAddModalOpen ? handleAddSubmit : handleEditSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : isAddModalOpen
                ? 'Create Combo'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !isSubmitting && setDeleteModal({ open: false, combo: null })}
        title="Delete Combo Offer"
        size="small"
      >
        <div className="delete-confirm">
          <p>
            Are you sure you want to delete the combo{' '}
            <strong>{deleteModal.combo?.name}</strong>?
          </p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            This deal will be immediately removed from the customer menu. Individual items in the menu will remain unaffected.
          </p>
          <div className="form-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setDeleteModal({ open: false, combo: null })}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Deal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
