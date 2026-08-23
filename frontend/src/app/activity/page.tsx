'use client';

import { useState, useEffect, useCallback } from 'react';
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
  'research.completed': '🔍',
  'document.ingested': '📄',
  'competitor.added': '🏢',
  'comment.posted': '💬',
  'webhook.triggered': '🔗',
  'prompt.created': '✨',
};

const EVENT_COLORS: Record<string, string> = {
  'research.completed': '#7c3aed',
  'document.ingested': '#0891b2',
  'competitor.added': '#d97706',
  'comment.posted': '#059669',
  'webhook.triggered': '#db2777',
  'prompt.created': '#6366f1',
};

const MOCK_FEED: ActivityEvent[] = [
  {
    id: '1',
    event_type: 'research.completed',
    entity_type: 'report',
    entity_id: 'rep-001',
    description: 'Market intelligence dossier for OpenAI completed with 94% confidence.',
    actor: 'JIGYASA AI',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    event_type: 'document.ingested',
    entity_type: 'document',
    entity_id: 'doc-021',
    description: 'Research paper "LLM Competitive Moats in 2025.pdf" indexed into RAG knowledge base.',
    actor: 'Knowledge Ingestion',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    event_type: 'competitor.added',
    entity_type: 'monitor',
    entity_id: 'trk-009',
    description: 'New competitor monitor created for Anthropic in AI Infrastructure vertical.',
    actor: 'Monitoring Engine',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    event_type: 'comment.posted',
    entity_type: 'report',
    entity_id: 'rep-001',
    description: 'Sarah Chen commented on OpenAI dossier: "Revenue projections need revision Q4."',
    actor: 'Sarah Chen',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    event_type: 'prompt.created',
    entity_type: 'prompt',
    entity_id: 'pmt-004',
    description: 'New AI prompt template "Deep Competitor Takedown" created for research workflows.',
    actor: 'Prompt Studio',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    event_type: 'webhook.triggered',
    entity_type: 'webhook',
    entity_id: 'whk-002',
    description: 'Webhook "Slack Alerts" delivered research.completed event — 200 OK.',
    actor: 'Notification Engine',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    event_type: 'research.completed',
    entity_type: 'report',
    entity_id: 'rep-002',
    description: 'Market intelligence dossier for Google DeepMind completed with 91% confidence.',
    actor: 'JIGYASA AI',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeedPage() {
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadFeed = useCallback(async () => {
    const data = await intelligenceApi.getActivityFeed(100);
    if (data && data.length > 0) {
      setFeed(data);
    } else {
      setFeed(MOCK_FEED);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    intelligenceApi.getActivityFeed(100).then(data => {
      if (!mounted) return;
      if (data && data.length > 0) setFeed(data);
      else setFeed(MOCK_FEED);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadFeed, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadFeed]);

  const eventTypes = ['all', ...Array.from(new Set(MOCK_FEED.map(e => e.event_type)))];
  const filtered = filter === 'all' ? feed : feed.filter(e => e.event_type === filter);

  const stats = {
    total: feed.length,
    research: feed.filter(e => e.event_type === 'research.completed').length,
    comments: feed.filter(e => e.event_type === 'comment.posted').length,
    documents: feed.filter(e => e.event_type === 'document.ingested').length,
  };

  return (
    <div className="activity-feed-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">📣</div>
          <div>
            <h1>Activity Feed</h1>
            <p className="header-subtitle">Real-time platform intelligence timeline</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(p => !p)}
          >
            {autoRefresh ? '🔄 Live' : '⏸ Paused'}
          </button>
          <button className="refresh-btn" onClick={() => { setLoading(true); loadFeed(); }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        {[
          { label: 'Total Events', value: stats.total, icon: '📊' },
          { label: 'Research Runs', value: stats.research, icon: '🔍' },
          { label: 'Comments', value: stats.comments, icon: '💬' },
          { label: 'Documents', value: stats.documents, icon: '📄' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {eventTypes.map(type => (
          <button
            key={type}
            className={`chip ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? '🌐 All Events' : `${EVENT_ICONS[type] || '•'} ${type.replace('.', ' ')}`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading activity feed...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No events yet</h3>
            <p>Platform activity will appear here as your team uses JIGYASA AI.</p>
          </div>
        ) : (
          <div className="timeline">
            {filtered.map((event) => {
              const color = EVENT_COLORS[event.event_type] || '#6b7280';
              const icon = EVENT_ICONS[event.event_type] || '•';
              return (
                <div key={event.id} className="timeline-item" style={{ '--accent': color } as React.CSSProperties}>
                  <div className="timeline-line" />
                  <div className="event-node" style={{ background: color }}>
                    {icon}
                  </div>
                  <div className="event-card">
                    <div className="event-header">
                      <span className="event-tag" style={{ background: `${color}22`, color }}>
                        {event.event_type}
                      </span>
                      <span className="event-time">{timeAgo(event.created_at)}</span>
                    </div>
                    <p className="event-description">{event.description}</p>
                    <div className="event-footer">
                      <span className="event-actor">
                        <span className="actor-dot" style={{ background: color }} />
                        {event.actor || 'System'}
                      </span>
                      {event.entity_id && (
                        <span className="entity-id">#{event.entity_id.slice(-6)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .activity-feed-page {
          min-height: 100vh;
          padding: 2rem;
          background: #0a0a12;
          color: #f0f0f8;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 12px rgba(124, 58, 237, 0.6));
        }

        h1 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .header-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .refresh-toggle {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 1px solid #374151;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .refresh-toggle.active {
          border-color: #059669;
          color: #10b981;
          background: rgba(5, 150, 105, 0.1);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .refresh-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          border: 1px solid #374151;
          background: rgba(255,255,255,0.05);
          color: #e5e7eb;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: #6b7280;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .stat-card:hover {
          border-color: rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.05);
        }

        .stat-icon { font-size: 1.5rem; }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f0f0f8;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .chip {
          padding: 0.375rem 1rem;
          border-radius: 9999px;
          border: 1px solid #374151;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.2s;
          text-transform: capitalize;
        }

        .chip:hover {
          border-color: #6b7280;
          color: #e5e7eb;
        }

        .chip.active {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.15);
          color: #a78bfa;
        }

        .timeline-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          gap: 1rem;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(124, 58, 237, 0.2);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-icon { font-size: 3rem; }
        .empty-state h3 { font-size: 1.25rem; font-weight: 600; color: #9ca3af; margin: 0; }
        .empty-state p { margin: 0; text-align: center; }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 24px 1fr;
          gap: 0 1rem;
          position: relative;
          padding-bottom: 1.5rem;
        }

        .timeline-line {
          position: absolute;
          left: 11px;
          top: 24px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, var(--accent, #7c3aed), transparent);
          opacity: 0.3;
        }

        .timeline-item:last-child .timeline-line { display: none; }

        .event-node {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          flex-shrink: 0;
          box-shadow: 0 0 12px var(--accent, rgba(124, 58, 237, 0.4));
          z-index: 1;
        }

        .event-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          transition: all 0.2s;
        }

        .event-card:hover {
          border-color: rgba(var(--accent), 0.3);
          background: rgba(255,255,255,0.05);
          transform: translateX(4px);
        }

        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .event-tag {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .event-time {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .event-description {
          font-size: 0.9rem;
          color: #d1d5db;
          line-height: 1.5;
          margin: 0 0 0.75rem;
        }

        .event-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .event-actor {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .actor-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .entity-id {
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}
