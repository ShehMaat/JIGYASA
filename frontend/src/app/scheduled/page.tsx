'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../services/api';

interface Schedule {
  id: string;
  company_name: string;
  industry: string;
  focus_areas: string[] | null;
  frequency: string;
  frequency_label: string;
  is_active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_report_id: string | null;
  last_digest: string[] | null;
  created_at: string;
}

const FREQUENCIES = [
  { value: 'daily', label: '⚡ Daily', desc: 'Runs every 24 hours' },
  { value: 'weekly', label: '📅 Weekly', desc: 'Runs every 7 days' },
  { value: 'monthly', label: '🗓️ Monthly', desc: 'Runs every 30 days' },
];

const FREQ_COLORS: Record<string, string> = {
  daily: '#059669',
  weekly: '#7c3aed',
  monthly: '#0891b2',
};

function timeUntil(isoDate: string | null): string {
  if (!isoDate) return 'Not scheduled';
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return 'Running soon...';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `in ${days}d`;
}

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ScheduledResearchPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [expandedDigest, setExpandedDigest] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    focus_areas: '',
    frequency: 'weekly',
  });
  const [creating, setCreating] = useState(false);

  const loadSchedules = useCallback(async () => {
    const data = await intelligenceApi.listSchedules();
    setSchedules(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    intelligenceApi.listSchedules().then(data => {
      if (!mounted) return;
      setSchedules(data || []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    if (!form.company_name.trim() || !form.industry.trim()) return;
    setCreating(true);
    const focusAreas = form.focus_areas
      ? form.focus_areas.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const result = await intelligenceApi.createSchedule({
      company_name: form.company_name,
      industry: form.industry,
      focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
      frequency: form.frequency,
    });
    if (result) {
      setSchedules(prev => [result, ...prev]);
      setForm({ company_name: '', industry: '', focus_areas: '', frequency: 'weekly' });
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleToggle = async (id: string) => {
    const updated = await intelligenceApi.toggleSchedule(id);
    if (updated) {
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningIds(prev => new Set(prev).add(id));
    await intelligenceApi.runScheduleNow(id);
    setTimeout(async () => {
      await loadSchedules();
      setRunningIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 2000);
  };

  const handleDelete = async (id: string) => {
    const ok = await intelligenceApi.deleteSchedule(id);
    if (ok) setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const stats = {
    total: schedules.length,
    active: schedules.filter(s => s.is_active).length,
    paused: schedules.filter(s => !s.is_active).length,
    withReports: schedules.filter(s => s.last_report_id).length,
  };

  return (
    <div className="scheduled-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">⏰</div>
          <div>
            <h1>Scheduled Research</h1>
            <p className="subtitle">Autonomous intelligence — set it and forget it</p>
          </div>
        </div>
        <button className="btn-create" onClick={() => setShowCreate(true)}>
          + New Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { label: 'Total', value: stats.total, icon: '⏰', color: '#7c3aed' },
          { label: 'Active', value: stats.active, icon: '✅', color: '#059669' },
          { label: 'Paused', value: stats.paused, icon: '⏸', color: '#d97706' },
          { label: 'With Reports', value: stats.withReports, icon: '📋', color: '#0891b2' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent': s.color } as React.CSSProperties}>
            <span className="stat-icon">{s.icon}</span>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⏰ New Scheduled Research</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>

            <div className="form-group">
              <label>Company / Subject *</label>
              <input
                placeholder="e.g. Anthropic, OpenAI, Tesla..."
                value={form.company_name}
                onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Industry *</label>
              <input
                placeholder="e.g. AI Infrastructure, SaaS, Biotech..."
                value={form.industry}
                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Focus Areas <span className="optional">(comma-separated, optional)</span></label>
              <input
                placeholder="e.g. funding, product releases, partnerships..."
                value={form.focus_areas}
                onChange={e => setForm(p => ({ ...p, focus_areas: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <div className="freq-grid">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.value}
                    className={`freq-card ${form.frequency === f.value ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                  >
                    <div className="freq-label">{f.label}</div>
                    <div className="freq-desc">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                className="btn-submit"
                onClick={handleCreate}
                disabled={creating || !form.company_name.trim() || !form.industry.trim()}
              >
                {creating ? '⏳ Creating...' : '⏰ Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Cards */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏰</div>
          <h3>No scheduled research yet</h3>
          <p>Create your first automated research schedule and let JIGYASA AI work for you 24/7.</p>
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            + Create First Schedule
          </button>
        </div>
      ) : (
        <div className="schedules-grid">
          {schedules.map(s => {
            const color = FREQ_COLORS[s.frequency] || '#6b7280';
            const isRunning = runningIds.has(s.id);
            return (
              <div key={s.id} className={`schedule-card ${!s.is_active ? 'paused' : ''}`}>
                {/* Card Header */}
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="company-avatar" style={{ background: `${color}22`, color }}>
                      {s.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="company-name">{s.company_name}</div>
                      <div className="industry-tag">{s.industry}</div>
                    </div>
                  </div>
                  <span className="freq-badge" style={{ background: `${color}22`, color }}>
                    {s.frequency_label}
                  </span>
                </div>

                {/* Focus Areas */}
                {s.focus_areas && s.focus_areas.length > 0 && (
                  <div className="focus-tags">
                    {s.focus_areas.map(f => (
                      <span key={f} className="focus-tag">{f}</span>
                    ))}
                  </div>
                )}

                {/* Timing Row */}
                <div className="timing-row">
                  <div className="timing-item">
                    <span className="timing-label">Next Run</span>
                    <span className={`timing-value ${s.is_active ? 'active' : 'muted'}`}>
                      {s.is_active ? timeUntil(s.next_run_at) : '⏸ Paused'}
                    </span>
                  </div>
                  <div className="timing-divider" />
                  <div className="timing-item">
                    <span className="timing-label">Last Run</span>
                    <span className="timing-value muted">{timeAgo(s.last_run_at)}</span>
                  </div>
                </div>

                {/* Latest Digest */}
                {s.last_digest && s.last_digest.length > 0 && (
                  <div className="digest-section">
                    <button
                      className="digest-toggle"
                      onClick={() => setExpandedDigest(expandedDigest === s.id ? null : s.id)}
                    >
                      🧠 Latest Digest {expandedDigest === s.id ? '▲' : '▼'}
                    </button>
                    {expandedDigest === s.id && (
                      <ul className="digest-bullets">
                        {s.last_digest.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="card-actions">
                  {s.last_report_id && (
                    <Link href={`/reports/${s.last_report_id}`} className="btn-action view">
                      📋 View Report
                    </Link>
                  )}
                  <button
                    className={`btn-action run ${isRunning ? 'running' : ''}`}
                    onClick={() => handleRunNow(s.id)}
                    disabled={isRunning}
                  >
                    {isRunning ? '⏳ Running...' : '▶ Run Now'}
                  </button>
                  <button
                    className={`btn-action toggle ${s.is_active ? 'pause' : 'resume'}`}
                    onClick={() => handleToggle(s.id)}
                  >
                    {s.is_active ? '⏸ Pause' : '▶ Resume'}
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(s.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .scheduled-page {
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

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 12px rgba(124,58,237,0.6));
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

        .subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
        }

        .btn-create {
          padding: 0.625rem 1.5rem;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(124,58,237,0.3);
        }

        .btn-create:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 28px rgba(124,58,237,0.5);
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
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
          border-color: var(--accent, rgba(124,58,237,0.3));
          background: rgba(124,58,237,0.04);
        }

        .stat-icon { font-size: 1.5rem; }
        .stat-value { font-size: 1.6rem; font-weight: 700; }
        .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal {
          background: #111120;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          color: #f0f0f8;
        }

        .modal-close {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
        }

        .modal-close:hover { color: #f0f0f8; }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .optional { color: #4b5563; font-weight: 400; text-transform: none; letter-spacing: 0; }

        .form-group input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #f0f0f8;
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .freq-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .freq-card {
          padding: 0.75rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .freq-card:hover {
          border-color: rgba(124,58,237,0.5);
        }

        .freq-card.selected {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.15);
        }

        .freq-label { font-size: 0.875rem; font-weight: 600; color: #e5e7eb; margin-bottom: 0.25rem; }
        .freq-desc { font-size: 0.72rem; color: #6b7280; }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .btn-cancel {
          padding: 0.6rem 1.25rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-cancel:hover { background: rgba(255,255,255,0.09); color: #e5e7eb; }

        .btn-submit {
          padding: 0.6rem 1.5rem;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-submit:not(:disabled):hover { transform: translateY(-1px); }

        /* Loading / Empty */
        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          gap: 1rem;
          color: #6b7280;
          text-align: center;
        }

        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(124,58,237,0.2);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-icon { font-size: 3.5rem; }
        .empty-state h3 { font-size: 1.25rem; font-weight: 600; color: #9ca3af; margin: 0; }
        .empty-state p { max-width: 380px; margin: 0; }

        /* Schedule Cards */
        .schedules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
        }

        .schedule-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.25s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .schedule-card:hover {
          border-color: rgba(124,58,237,0.3);
          background: rgba(124,58,237,0.04);
          transform: translateY(-2px);
        }

        .schedule-card.paused {
          opacity: 0.65;
          border-style: dashed;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .company-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .company-name { font-size: 1rem; font-weight: 700; color: #f0f0f8; }
        .industry-tag { font-size: 0.78rem; color: #9ca3af; margin-top: 2px; }

        .freq-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .focus-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .focus-tag {
          padding: 0.2rem 0.6rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9999px;
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .timing-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
        }

        .timing-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .timing-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .timing-value { font-size: 0.875rem; font-weight: 600; color: #f0f0f8; }
        .timing-value.active { color: #10b981; }
        .timing-value.muted { color: #9ca3af; }
        .timing-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.07); }

        .digest-section { display: flex; flex-direction: column; gap: 0.5rem; }

        .digest-toggle {
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #a78bfa;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .digest-toggle:hover { background: rgba(124,58,237,0.18); }

        .digest-bullets {
          list-style: none;
          margin: 0;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .digest-bullets li {
          font-size: 0.82rem;
          color: #d1d5db;
          line-height: 1.5;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: auto;
          padding-top: 0.25rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .btn-action {
          padding: 0.4rem 0.875rem;
          border-radius: 7px;
          border: 1px solid transparent;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .btn-action.view {
          background: rgba(8,145,178,0.12);
          border-color: rgba(8,145,178,0.25);
          color: #22d3ee;
        }

        .btn-action.view:hover { background: rgba(8,145,178,0.22); }

        .btn-action.run {
          background: rgba(5,150,105,0.12);
          border-color: rgba(5,150,105,0.25);
          color: #10b981;
        }

        .btn-action.run:hover:not(:disabled) { background: rgba(5,150,105,0.22); }
        .btn-action.run.running { opacity: 0.7; cursor: not-allowed; }

        .btn-action.pause {
          background: rgba(217,119,6,0.12);
          border-color: rgba(217,119,6,0.25);
          color: #f59e0b;
        }

        .btn-action.pause:hover { background: rgba(217,119,6,0.22); }

        .btn-action.resume {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.25);
          color: #a78bfa;
        }

        .btn-action.resume:hover { background: rgba(124,58,237,0.22); }

        .btn-action.delete {
          background: rgba(220,38,38,0.08);
          border-color: rgba(220,38,38,0.2);
          color: #f87171;
          margin-left: auto;
        }

        .btn-action.delete:hover { background: rgba(220,38,38,0.18); }
      `}</style>
    </div>
  );
}
