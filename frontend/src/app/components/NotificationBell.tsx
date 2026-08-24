'use client';

import { useState, useEffect, useRef } from 'react';
import { intelligenceApi } from '../../services/api';

interface ActivityEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  actor: string | null;
  created_at: string;
}

const EVENT_ICONS: Record<string, string> = {
  'research.completed':    '🔍',
  'document.ingested':     '📄',
  'competitor.added':      '🏢',
  'comment.posted':        '💬',
  'webhook.triggered':     '🔗',
  'prompt.created':        '✨',
  'schedule.created':      '⏰',
  'schedule.digest.ready': '🧠',
  'schedule.run_now':      '▶',
  'schedule.resumed':      '▶',
  'schedule.paused':       '⏸',
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const STORAGE_KEY = 'jigyasa_notif_last_read';

export default function NotificationBell() {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [lastRead, setLastRead] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  // Fetch events on mount + every 30s + listen on SSE stream
  useEffect(() => {
    const fetchEvents = () => {
      intelligenceApi.getActivityFeed(20).then(data => {
        if (data && Array.isArray(data)) setEvents(data);
      });
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);

    // EventSource SSE Connection
    let es: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        es = new EventSource('/api/v1/notifications/stream');
        es.onmessage = () => {
          fetchEvents();
        };
      } catch (err) {
        console.warn('SSE notification stream unavailable:', err);
      }
    }

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = events.filter(e => new Date(e.created_at).getTime() > lastRead).length;

  const markAllRead = () => {
    const now = Date.now();
    setLastRead(now);
    localStorage.setItem(STORAGE_KEY, String(now));
  };

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  return (
    <div style={{ position: 'relative' }} ref={drawerRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          background: open ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.1rem',
          transition: 'all 0.2s',
          animation: unreadCount > 0 ? 'bellWiggle 2.5s ease-in-out infinite' : 'none',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#dc2626',
            color: '#fff',
            borderRadius: '9999px',
            fontSize: '0.6rem',
            fontWeight: '700',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid #0a0a12',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '340px',
          background: '#111120',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(124,58,237,0.1)',
          zIndex: 9998,
          overflow: 'hidden',
          animation: 'slideDownFade 0.18s ease',
        }}>
          {/* Drawer Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔔</span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f0f0f8' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'rgba(220,38,38,0.2)',
                  color: '#f87171',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.5rem',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Events List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📭</div>
                <div>No notifications yet</div>
              </div>
            ) : (
              events.map(e => {
                const isUnread = new Date(e.created_at).getTime() > lastRead;
                const icon = EVENT_ICONS[e.event_type] || '•';
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isUnread ? 'rgba(124,58,237,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: isUnread ? '#e5e7eb' : '#9ca3af',
                        lineHeight: 1.45,
                        fontWeight: isUnread ? 500 : 400,
                      }}>
                        {e.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>{e.actor || 'System'}</span>
                        <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#4b5563' }} />
                        <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>{timeAgo(e.created_at)}</span>
                      </div>
                    </div>
                    {isUnread && (
                      <span style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: '#7c3aed',
                        flexShrink: 0,
                        marginTop: '6px',
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div style={{
            padding: '0.625rem 1rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <a
              href="/activity"
              onClick={() => setOpen(false)}
              style={{ fontSize: '0.78rem', color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}
            >
              View full activity feed →
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellWiggle {
          0%, 85%, 100% { transform: rotate(0deg); }
          87% { transform: rotate(-10deg); }
          89% { transform: rotate(10deg); }
          91% { transform: rotate(-8deg); }
          93% { transform: rotate(8deg); }
          95% { transform: rotate(0deg); }
        }
        @keyframes slideDownFade {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
