import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';

/**
 * GlobalConnectionStatus - Rendered at the root level of the app (not inside
 * any backdrop-filter parent) so that position:fixed works correctly and
 * appears top-right on screen.
 */
export default function GlobalConnectionStatus() {
  const { isConnected } = useSocket();
  const [isDesktop, setIsDesktop] = useState(() =>
    window.matchMedia('(min-width: 769px)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    const handleChange = (event) => setIsDesktop(event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const StatusRoot = isDesktop ? 'span' : 'div';

  return (
    <StatusRoot
      className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
      role="status"
      aria-live="polite"
    >
      <span className="status-dot"></span>
      <span className="status-text">
        {isConnected ? 'Live' : 'Connecting…'}
      </span>
    </StatusRoot>
  );
}
