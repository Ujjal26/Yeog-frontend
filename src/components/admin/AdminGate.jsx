import { useState } from 'react';
import './AdminGate.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin`;

export default function AdminGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('yeog_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('yeog_admin_auth', 'true');
        sessionStorage.setItem('yeog_admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Incorrect password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="admin-gate">
      <div className={`gate-card card card-elevated animate-scaleIn ${shake ? 'shake' : ''}`}>
        <div className="gate-header">
          <span className="gate-icon">🔐</span>
          <h2>Staff Portal</h2>
          <p>Enter the admin password to access the dashboard.</p>
        </div>
        <form className="gate-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error && <span className="gate-error">{error}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg gate-submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

      </div>
    </div>
  );
}
