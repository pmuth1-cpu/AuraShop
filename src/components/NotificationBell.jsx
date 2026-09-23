import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBell, HiVolumeUp } from 'react-icons/hi';
import { notificationAPI } from '../api';
import { requestBrowserNotificationPermission, showBrowserNotification } from '../utils/browserNotification';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);
  const navigate = useNavigate();

  // Fetch unread count on mount and periodically (every 20s for active responsiveness)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      const newCount = data.count || 0;

      // If new notifications arrived and count increased, alert the user via browser notification
      if (newCount > prevCountRef.current && prevCountRef.current > 0) {
        // Fetch the newest notification to show content in the browser notification
        try {
          const latestRes = await notificationAPI.getAll({ limit: 1 });
          const latest = latestRes.data?.notifications?.[0];
          if (latest) {
            showBrowserNotification(latest.title || 'New Notification', {
              body: latest.message || 'You have a new update in your shop.',
              link: latest.link || '/dashboard',
            });
          }
        } catch {
          showBrowserNotification('Aura Shop Notification', {
            body: `You have ${newCount} unread notification(s).`,
            link: '/dashboard',
          });
        }
      }

      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch { /* ignore */ }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ limit: 10 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      prevCountRef.current = data.unreadCount || 0;
    } catch { /* ignore */ }
    setLoading(false);
  }

  function toggleDropdown() {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  }

  async function handleEnableBrowserAlerts() {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermission(granted ? 'granted' : 'denied');
    if (granted) {
      showBrowserNotification('Browser Alerts Enabled 🎉', {
        body: 'You will receive instant alerts for new orders and payments!',
      });
    }
  }

  async function handleClick(notif) {
    if (!notif.read) {
      try {
        await notificationAPI.markAsRead(notif._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch { /* ignore */ }
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      prevCountRef.current = 0;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        className="admin-nav-item"
        style={{
          position: 'relative', width: '100%',
          display: 'flex', alignItems: 'center', gap: '10px',
          border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer',
        }}
      >
        <HiBell />
        Notifications
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '6px', right: '10px',
            background: 'var(--danger, #ef4444)', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700,
            minWidth: '18px', height: '18px',
            borderRadius: '9px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '0',
          width: '320px', maxHeight: '420px', overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 1000, marginBottom: '8px',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border-glass)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Browser Alert banner if not enabled */}
          {browserPermission !== 'granted' && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(139,92,246,0.1)',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Enable desktop alerts
              </span>
              <button
                onClick={handleEnableBrowserAlerts}
                className="btn btn-sm btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.7rem' }}
              >
                <HiVolumeUp size={12} /> Enable
              </button>
            </div>
          )}

          {/* Notification list */}
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, var(--text-secondary))' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-glass)',
                  cursor: notif.link ? 'pointer' : 'default',
                  background: notif.read ? 'transparent' : 'rgba(139,92,246,0.06)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(139,92,246,0.06)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ fontWeight: notif.read ? 400 : 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {notif.title}
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--accent)', flexShrink: 0, marginTop: '4px',
                    }} />
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, var(--text-secondary))', marginTop: '4px', opacity: 0.7 }}>
                  {timeAgo(notif.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
