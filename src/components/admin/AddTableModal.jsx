import { useState } from 'react';
import Modal from '../common/Modal';
import './AddTableModal.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tables`;

export default function AddTableModal({ isOpen, onClose, onTableAdded }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTable = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        onTableAdded(data.table);
        onClose();
      } else {
        setError(data.message || 'Failed to add table');
      }
    } catch (err) {
      console.error('Add table error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Table" size="small">
      <div className="add-table-content">
        <div className="add-table-icon">🪑</div>
        <p className="add-table-desc">
          Are you sure you want to add a new table? The next available number will be assigned automatically.
        </p>

        {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddTable}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
