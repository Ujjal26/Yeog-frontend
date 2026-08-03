/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import AddTableModal from '../../components/admin/AddTableModal';
import { QRCodeCanvas } from 'qrcode.react';
import './TableManagementPage.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tables`;

export default function TableManagementPage() {
  const [tables, setTables] = useState([]);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const fetchTables = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Listen for real-time table state changes
  useEffect(() => {
    if (!socket) return;

    const handleActiveTables = (activeTableNumbers) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.status === 'closed') return t;
          if (activeTableNumbers.includes(t.number)) {
            return { ...t, status: 'active' };
          }
          if (t.status === 'active') {
            return { ...t, status: 'available' };
          }
          return t;
        })
      );
    };

    const handleNewTable = (data) => {
      setTables((prev) =>
        prev.map((t) =>
          t.number === parseInt(data.tableId, 10) && t.status !== 'closed'
            ? { ...t, status: 'active' }
            : t
        )
      );
    };

    const handleTableClosed = (tableNumber) => {
      setTables((prev) =>
        prev.map((t) =>
          t.number === parseInt(tableNumber, 10) && t.status !== 'closed'
            ? { ...t, status: 'available' }
            : t
        )
      );
    };

    socket.on('active_tables', handleActiveTables);
    socket.on('new_table_joined', handleNewTable);
    socket.on('table_closed', handleTableClosed);

    return () => {
      socket.off('active_tables', handleActiveTables);
      socket.off('new_table_joined', handleNewTable);
      socket.off('table_closed', handleTableClosed);
    };
  }, [socket]);

  const handleToggleStatus = async (tableId, currentStatus) => {
    // If the table is active, prevent closing it entirely in the UI first.
    if (currentStatus === 'active') {
      setError('Cannot close a table that is currently active with customers.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const newStatus = currentStatus === 'closed' ? 'available' : 'closed';
    setIsUpdating(true);
    setError('');

    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const response = await fetch(`${API_URL}/${tableId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTables((prev) =>
          prev.map((t) => (t._id === tableId ? { ...t, status: newStatus } : t))
        );
      } else {
        setError(data.message || 'Failed to update table status');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Server error while toggling status');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyQRLink = (tableNumber, qrToken) => {
    const url = `${window.location.origin}/order?table=${tableNumber}&token=${qrToken}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        // Optional: show a toast or alert
        alert(`Secure QR Link for Table ${tableNumber} copied to clipboard!`);
      })
      .catch((err) => {
        console.error('Failed to copy link', err);
        alert('Failed to copy link');
      });
  };

  const downloadQR = (tableNumber) => {
    const canvas = document.getElementById(`qr-table-${tableNumber}`);
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Table_${tableNumber}_QRCode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
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
              <h1>Table Management</h1>
              <p>Add new tables or temporarily close existing ones.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setIsAddTableModalOpen(true)}
            >
              + Add Table
            </button>
          </div>

          {error && <div className="toast toast-error animate-slideUp">{error}</div>}

          <div className="table-management-list animate-slideUp stagger-1">
            {tables.map((table) => {
              const isClosed = table.status === 'closed';
              const isActive = table.status === 'active';
              return (
                <div key={table._id} className="table-management-card card">
                  <div className="table-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: '5px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => downloadQR(table.number)} title="Click to download QR Code">
                      <QRCodeCanvas 
                        id={`qr-table-${table.number}`}
                        value={`${window.location.origin}/order?table=${table.number}&token=${table.qrToken}`} 
                        size={64} 
                      />
                    </div>
                    <div>
                      <h3>Table {table.number}</h3>
                      <span className={`badge ${isClosed ? 'badge-neutral' : isActive ? 'badge-warning badge-dot' : 'badge-success'}`}>
                        {isActive ? 'Live' : table.status}
                      </span>
                    </div>
                  </div>
                  <div className="table-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => downloadQR(table.number)}
                      title="Download the QR Code image"
                    >
                      📥 Download QR
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => copyQRLink(table.number, table.qrToken)}
                      title="Copy the secure QR Code URL for printing"
                    >
                      🔗 Copy QR Link
                    </button>
                    <button
                      className={`btn btn-sm ${isClosed ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleToggleStatus(table._id, table.status)}
                      disabled={isUpdating || isActive}
                      title={isActive ? "Cannot close an active table" : ""}
                    >
                      {isClosed ? 'Re-open Table' : 'Close Temporarily'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <AddTableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onTableAdded={(newTable) => {
          setTables((prev) => [...prev, newTable]);
        }}
      />
    </div>
  );
}
