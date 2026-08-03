import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import ChangePasswordModal from './ChangePasswordModal';
import './Sidebar.css';

export default function Sidebar() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { isConnected } = useSocket();

  const links = [
    { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { path: '/admin/orders', label: 'Live Orders', icon: '🔥', end: false },
    { path: '/admin/tables', label: 'Tables', icon: '🪑', end: false },
    { path: '/admin/menu', label: 'Menu Editor', icon: '📝', end: false },
  ];

  return (
    <aside className="sidebar" id="admin-sidebar">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">☕</span>
          <div className="logo-text">
            <span className="logo-yeog">Yeog</span>
            <span className="logo-cafe">Cafe</span>
          </div>
        </div>
        <span className="sidebar-badge badge badge-primary">Staff</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="sidebar-link sidebar-link-back" 
          onClick={() => setIsPasswordModalOpen(true)}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="sidebar-link-icon">🔑</span>
          <span className="sidebar-link-label">Change Password</span>
        </button>
        <NavLink to="/" className="sidebar-link sidebar-link-back">
          <span className="sidebar-link-icon">🏠</span>
          <span className="sidebar-link-label">Back to Site</span>
        </NavLink>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </aside>
  );
}
