'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { intelligenceApi } from '../../../services/api';
import { MarketReport } from '../../../types/intelligence';

type TabKey = 'overview' | 'competitors' | 'matrix' | 'swot' | 'strategy' | 'risks' | 'evidence';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'competitors', label: 'Competitors', icon: '🏢' },
  { key: 'matrix', label: 'Comparison', icon: '📐' },
  { key: 'swot', label: 'SWOT', icon: '🎯' },
  { key: 'strategy', label: 'Strategy', icon: '🚀' },
  { key: 'risks', label: 'Risks', icon: '⚠️' },
  { key: 'evidence', label: 'Evidence', icon: '🔗' },
];

export default function ReportViewerPage() {
  const params = useParams();
  const reportId = params.id as string;


  const [report, setReport] = useState<MarketReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await intelligenceApi.getReport(reportId);
        setReport(r);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    if (reportId) load();
  }, [reportId]);

  const handleCopy = () => {
    if (report?.executive_summary) {
      navigator.clipboard.writeText(report.executive_summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (report) {
      const filename = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
      intelligenceApi.downloadMarkdownExport(report.id, filename);
    }
  };

  const parseShareNumber = (shareStr: string = '10%') => {
    const match = shareStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 15;
  };

  if (isLoading) {
    return (
      <div className="animate-in" style={{ maxWidth: '1100px' }}>
        <div className="skeleton" style={{ height: '40px', width: '300px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '200px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '60px auto' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</p>
        <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>Report Not Found</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>This report may have been deleted or does not exist.</p>
        <Link href="/reports"><button className="btn-primary">← Back to Reports</button></Link>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1100px' }}>
      {/* Back + Header */}
      <div style={{ marginBottom: '8px' }}>
        <Link href="/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
          ← Back to Reports
        </Link>
      </div>

      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem' }}>{report.title}</h1>
          <p>{new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleCopy}>
            {copySuccess ? '✅ Copied!' : '📋 Copy Summary'}
          </button>
          <button className="btn-secondary" onClick={handleDownload}>📥 Export MD</button>
          <button className="btn-secondary" onClick={() => window.print()}>🖨️ Print PDF</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in animate-in-delay-2">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Executive Summary</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {report.executive_summary}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {[
                { label: 'TAM', value: report.market_overview?.tam, color: 'var(--primary-accent)' },
                { label: 'SAM', value: report.market_overview?.sam, color: 'var(--secondary-accent)' },
                { label: 'SOM', value: report.market_overview?.som, color: 'var(--success)' },
                { label: 'CAGR', value: report.market_overview?.cagr, color: 'var(--warning)' },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel" style={{ padding: '18px' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '1.2rem', fontWeight: '700', color: stat.color }}>
                    {stat.value || 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {report.market_overview?.key_trends && report.market_overview.key_trends.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px', marginTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '14px' }}>📈 Key Market Trends</h3>
                {report.market_overview.key_trends.map((trend, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary-accent)', fontWeight: '700', fontSize: '0.82rem', minWidth: '20px' }}>{i + 1}.</span>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{trend}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {(report.competitor_analysis || []).map((comp, i) => (
              <div key={i} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{comp.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{comp.market_position}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary-accent)' }}>{comp.estimated_market_share}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Market Share</p>
                  </div>
                </div>

                {/* Market Share Bar */}
                <div className="progress-bar" style={{ marginBottom: '16px' }}>
                  <div className="progress-bar-fill" style={{ width: `${parseShareNumber(comp.estimated_market_share)}%` }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: '600', marginBottom: '6px' }}>✅ Strengths</p>
                    {comp.key_strengths?.map((s, j) => (
                      <p key={j} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>• {s}</p>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: '600', marginBottom: '6px' }}>❌ Weaknesses</p>
                    {comp.key_weaknesses?.map((w, j) => (
                      <p key={j} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>• {w}</p>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Pricing</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{comp.pricing_strategy}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Target</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{comp.target_segment}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Moat</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{comp.differentiation_factor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>📐 Competitor Comparison Matrix</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Competitor', 'Position', 'Share', 'Pricing', 'Target', 'Moat'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-subtle)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(report.competitor_analysis || []).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-main)' }}>{c.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.market_position}</td>
                    <td style={{ padding: '12px', color: 'var(--primary-accent)', fontWeight: '600' }}>{c.estimated_market_share}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '180px' }}>{c.pricing_strategy}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.target_segment}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '180px' }}>{c.differentiation_factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SWOT Tab */}
        {activeTab === 'swot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { title: 'Strengths', items: report.swot_analysis?.strengths, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: '💪' },
              { title: 'Weaknesses', items: report.swot_analysis?.weaknesses, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', icon: '⚡' },
              { title: 'Opportunities', items: report.swot_analysis?.opportunities, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', icon: '🌟' },
              { title: 'Threats', items: report.swot_analysis?.threats, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', icon: '🔥' },
            ].map((quadrant) => (
              <div
                key={quadrant.title}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderTop: `3px solid ${quadrant.color}`,
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '14px', color: quadrant.color }}>
                  {quadrant.icon} {quadrant.title}
                </h3>
                {(quadrant.items || []).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '8px',
                      background: quadrant.bg,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {(report.strategic_recommendations || []).map((rec, i) => (
              <div key={i} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{rec.title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`badge ${rec.priority === 'High' ? 'badge-danger' : rec.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                      {rec.priority}
                    </span>
                    <span className="badge badge-primary">{rec.timeframe}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
                  {rec.description}
                </p>
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <p style={{ fontSize: '0.82rem', color: '#6ee7b7' }}>
                    📈 <strong>Expected Impact:</strong> {rec.expected_impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {(report.risk_matrix || []).map((risk, i) => (
              <div key={i} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{risk.risk_title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`badge ${risk.severity === 'High' || risk.severity === 'Critical' ? 'badge-danger' : risk.severity === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                      Severity: {risk.severity}
                    </span>
                    <span className={`badge ${risk.likelihood === 'High' ? 'badge-danger' : risk.likelihood === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                      Likelihood: {risk.likelihood}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    🛡️ <strong>Mitigation:</strong> {risk.mitigation_strategy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {(report.raw_evidence || []).length === 0 ? (
              <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No sourced evidence available for this report.</p>
              </div>
            ) : (
              (report.raw_evidence || []).map((ev, i) => (
                <div key={i} className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>
                        {ev.title || ev.source}
                      </p>
                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--secondary-accent)', wordBreak: 'break-all' }}
                        >
                          {ev.url}
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {ev.category && <span className="badge badge-primary">{ev.category}</span>}
                      {ev.confidence_score && (
                        <span className="badge badge-success">
                          {Math.round(ev.confidence_score * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.snippet && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
                      &ldquo;{ev.snippet}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
