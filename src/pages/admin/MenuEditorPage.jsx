import { useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { formatPrice } from '../../utils/helpers';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import Modal from '../../components/common/Modal';
import './MenuEditorPage.css';

export default function MenuEditorPage() {
  const { menuItems, menuCategories, toggleAvailability, updateItem, deleteItem, addItem } = useMenu();
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  
  // Forms state
  const [form, setForm] = useState({ name: '', price: '', description: '', category: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredItems =
    activeCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const resetForm = () => {
    setForm({ name: '', price: '', description: '', category: '' });
    setImageFile(null);
    setError('');
  };

  const handleAddOpen = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditOpen = (item) => {
    resetForm();
    setForm({ name: item.name, price: item.price, description: item.description, category: item.category });
    setEditModal({ open: true, item });
  };

  // Generic Image Upload Handler
  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('photo', imageFile);

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.imageUrl;
  };

  const handleAddSubmit = async () => {
    try {
      if (!form.name || !form.price || !form.description || !form.category || !imageFile) {
        setError('All fields and an image are required');
        return;
      }
      setIsSubmitting(true);
      setError('');
      
      const imageUrl = await uploadImage();
      
      const res = await addItem({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        image: imageUrl,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        resetForm();
      } else {
        setError(res.error || 'Failed to add item');
      }
    } catch (err) {
      setError(err.message || 'Error saving item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      if (!form.name || !form.price || !form.description || !form.category) {
        setError('All fields are required');
        return;
      }
      setIsSubmitting(true);
      setError('');
      
      let imageUrl = editModal.item.image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      const res = await updateItem(editModal.item.id, {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        image: imageUrl,
      });

      if (res.success) {
        setEditModal({ open: false, item: null });
        resetForm();
      } else {
        setError(res.error || 'Failed to update item');
      }
    } catch (err) {
      setError(err.message || 'Error saving item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.item) {
      setIsSubmitting(true);
      await deleteItem(deleteModal.item.id);
      setIsSubmitting(false);
      setDeleteModal({ open: false, item: null });
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-mobile-nav">
        <Navbar variant="admin" />
      </div>

      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          <div className="admin-header animate-slideDown" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Menu Editor</h1>
              <p>Manage your menu items, availability, and pricing.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="badge badge-primary badge-dot">
                {menuItems.length} items
              </span>
              <button className="btn btn-primary" onClick={handleAddOpen}>
                + Add Item
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="editor-tabs animate-slideUp">
            <button
              className={`editor-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All
            </button>
            {menuCategories.map((cat) => (
              <button
                key={cat}
                className={`editor-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Data Table */}
          <div className="menu-table-wrap card animate-slideUp stagger-2">
            <table className="menu-table" id="menu-editor-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className={!item.isAvailable ? 'row-unavailable' : ''}>
                    <td>
                      <div className="table-item-cell">
                        <img src={item.image} alt={item.name} className="table-item-thumb" />
                        <div className="table-item-info">
                          <span className="table-item-name">{item.name}</span>
                          <span className="table-item-desc">{item.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.category}</span>
                    </td>
                    <td className="table-price">{formatPrice(item.price)}</td>
                    <td>
                      <label className="toggle-switch" id={`toggle-${item.id}`}>
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={() => toggleAvailability(item.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditOpen(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteModal({ open: true, item })}
                          aria-label={`Delete ${item.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add New Menu Item"
      >
        <div className="edit-form">
          {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={isSubmitting} />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Price (₹)</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={isSubmitting} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" className="input" placeholder="e.g. Coffee" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isSubmitting} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isSubmitting}></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Item Image</label>
            <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile(e.target.files[0])} disabled={isSubmitting} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => !isSubmitting && setEditModal({ open: false, item: null })}
        title="Edit Menu Item"
      >
        <div className="edit-form">
          {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={isSubmitting} />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Price (₹)</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={isSubmitting} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isSubmitting} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isSubmitting}></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Update Image (Optional)</label>
            <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile(e.target.files[0])} disabled={isSubmitting} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditModal({ open: false, item: null })} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !isSubmitting && setDeleteModal({ open: false, item: null })}
        title="Delete Item"
        size="small"
      >
        <div className="delete-confirm">
          <p>
            Are you sure you want to delete <strong>{deleteModal.item?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteModal({ open: false, item: null })} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
