import { useSocket } from '../../context/SocketContext';

/**
 * GlobalConnectionStatus - Rendered at the root level of the app (not inside
 * any backdrop-filter parent) so that position:fixed works correctly and
 * appears top-right on screen.
 */
export default function GlobalConnectionStatus() {
  const { isConnected } = useSocket();

  return (
    <div
      className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
      role="status"
      aria-live="polite"
    >
      <span className="status-dot"></span>
      <span className="status-text">
        {isConnected ? 'Live' : 'Connecting…'}
      </span>
    </div>
  );
}
