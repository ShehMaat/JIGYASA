'use client';

import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/api';

interface Tracker {
  id: string;
  company_name: string;
  industry: string;
  target_competitors: string[];
  frequency: string;
  status: string;
  last_scanned_at?: string;
  created_at: string;
  alert_count: number;
}

interface Alert {
  id: string;
  tracker_id: string;
  company_name: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  source_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function MonitoringPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [tList, aList] = await Promise.all([
          intelligenceApi.listTrackers(),
          intelligenceApi.listAlerts(),
        ]);
        setTrackers(tList);
        setAlerts(aList);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry.trim()) return;

    setIsSubmitting(true);
    const parsedComps = competitors.split(',').map((c) => c.trim()).filter(Boolean);

    try {
      const created = await intelligenceApi.createTracker({
        company_name: companyName,
        industry: industry,
        target_competitors: parsedComps,
        frequency: frequency,
      });

      if (created) {
        setTrackers((prev) => [created, ...prev]);
        setCompanyName('');
        setIndustry('');
        setCompetitors('');
        setShowModal(false);
        // Refresh alerts
        const updatedAlerts = await intelligenceApi.listAlerts();
        setAlerts(updatedAlerts);
      }
    } catch (err) {
      console.error('Failed to create tracker:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescan = async (trackerId: string) => {
    try {
      await intelligenceApi.rescanTracker(trackerId);
      const [updatedTrackers, updatedAlerts] = await Promise.all([
        intelligenceApi.listTrackers(),
        intelligenceApi.listAlerts(),
      ]);
      setTrackers(updatedTrackers);
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error('Failed to rescan tracker:', err);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    const ok = await intelligenceApi.deleteTracker(id);
    if (ok) {
      setTrackers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Competitor <span className="gradient-text">Monitoring</span>
          </h1>
          <p>Automated shift detection & live pricing/feature tracking feeds</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="new-tracker-btn">
          📡 New Tracker
        </button>
      </div>

      {/* Create Tracker Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>📡 Create Competitor Tracker</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTracker}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Target Company *
                </label>
                <input
                  className="input-field"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Notion, Snowflake"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Industry / Sector *
                </label>
                <input
                  className="input-field"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Fintech, Productivity SaaS"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Target Competitors (comma-separated)
                </label>
                <input
                  className="input-field"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="e.g. Adyen, PayPal, Square"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Scan Frequency
                </label>
                <select className="input-field" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="daily">Daily Crawl & Shift Alert</option>
                  <option value="weekly">Weekly Strategic Summary</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || !companyName.trim() || !industry.trim()}>
                  {isSubmitting ? 'Activating...' : 'Activate Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Trackers List & Alert Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Active Trackers Column */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
            📡 Active Trackers ({trackers.length})
          </h2>

          {isLoading ? (
            <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-md)' }} />
          ) : trackers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</p>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>No Active Trackers</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
                Set up automated monitoring to track pricing changes and feature shifts.
              </p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>📡 Create Tracker</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {trackers.map((t) => (
                <div key={t.id} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{t.company_name}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{t.industry}</p>
                    </div>
                    <span className="badge badge-success">{t.status}</span>
                  </div>

                  {t.target_competitors && t.target_competitors.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>Rivals:</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {t.target_competitors.map((c, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      Last scan: {t.last_scanned_at ? new Date(t.last_scanned_at).toLocaleTimeString() : 'Pending initial crawl'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => handleRescan(t.id)}>
                        🔄 Re-scan
                      </button>
                      <button className="btn-danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => handleDeleteTracker(t.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Alert Feed Column */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
            🔔 Live Shift Alert Feed ({alerts.length})
          </h2>

          {isLoading ? (
            <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-md)' }} />
          ) : alerts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</p>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>No Alerts Yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Alerts will automatically populate as competitor shifts are detected.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {alerts.map((a) => (
                <div key={a.id} className="glass-panel" style={{ padding: '16px', borderLeft: `3px solid ${a.severity === 'High' ? 'var(--danger)' : a.severity === 'Medium' ? 'var(--warning)' : 'var(--primary-accent)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '600' }}>{a.title}</h4>
                    <span className={`badge ${a.severity === 'High' ? 'badge-danger' : 'badge-primary'}`}>
                      {a.alert_type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '8px' }}>
                    {a.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      {new Date(a.created_at).toLocaleTimeString()}
                    </span>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--secondary-accent)' }}>
                        🔗 View Reference
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
