'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../services/api';
import { MarketReport } from '../../types/intelligence';

export default function ComparePage() {
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await intelligenceApi.listReports();
        setReports(list);
        if (list.length >= 2) {
          setSelectedReportIds([list[0].id, list[1].id]);
        } else if (list.length === 1) {
          setSelectedReportIds([list[0].id]);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const toggleSelectReport = (id: string) => {
    if (selectedReportIds.includes(id)) {
      if (selectedReportIds.length > 1) {
        setSelectedReportIds((prev) => prev.filter((rId) => rId !== id));
      }
    } else {
      if (selectedReportIds.length < 3) {
        setSelectedReportIds((prev) => [...prev, id]);
      } else {
        setSelectedReportIds((prev) => [prev[1], prev[2], id]);
      }
    }
  };

  const comparedReports = selectedReportIds
    .map((id) => reports.find((r) => r.id === id))
    .filter((r): r is MarketReport => r !== undefined);

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Battlecard <span className="gradient-text">Comparison</span>
          </h1>
          <p>Side-by-side competitive intelligence matrix and strategic positioning</p>
        </div>
        <button className="btn-secondary" onClick={() => window.print()}>
          🖨️ Print Matrix
        </button>
      </div>

      {/* Report Selector Pills */}
      <div
        className="glass-panel animate-in animate-in-delay-1"
        style={{ padding: '20px', marginBottom: '28px' }}
      >
        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-muted)' }}>
          Select 2 to 3 Reports to Compare:
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {reports.map((r) => {
            const isSelected = selectedReportIds.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleSelectReport(r.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? 'var(--primary-accent)' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isSelected ? '✅' : '➕'}</span>
                <span>{r.title.replace('Market Intelligence & Competitor Dossier: ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid */}
      {isLoading ? (
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-md)' }} />
      ) : comparedReports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📐</p>
          <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>
            No Reports Selected for Comparison
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Generate at least 2 market dossiers to compare side-by-side.
          </p>
          <Link href="/research"><button className="btn-primary">🔬 Launch Research</button></Link>
        </div>
      ) : (
        <div className="animate-in animate-in-delay-2" style={{ display: 'grid', gap: '24px' }}>
          {/* Overview Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${comparedReports.length}, 1fr)`,
              gap: '16px',
            }}
          >
            {comparedReports.map((report) => (
              <div key={report.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span className="badge badge-primary" style={{ marginBottom: '8px' }}>Target Brand</span>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{report.title.split(': ')[1] || report.title}</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Generated {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* TAM/CAGR Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>TAM</p>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-accent)' }}>
                      {report.market_overview?.tam || 'N/A'}
                    </p>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>CAGR</p>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)' }}>
                      {report.market_overview?.cagr || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Executive Summary */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Executive Briefing
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {report.executive_summary}
                  </p>
                </div>

                {/* Top Competitors */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    Top Direct Competitors ({report.competitor_analysis?.length || 0})
                  </h4>
                  {(report.competitor_analysis || []).map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        marginBottom: '6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{c.name}</span>
                      <span className="badge badge-primary">{c.estimated_market_share}</span>
                    </div>
                  ))}
                </div>

                {/* Top Strengths */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--success)' }}>
                    ✅ Core Strengths
                  </h4>
                  {(report.swot_analysis?.strengths || []).slice(0, 3).map((s, idx) => (
                    <p key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      • {s}
                    </p>
                  ))}
                </div>

                {/* Primary Recommendation */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-accent)' }}>
                    🚀 Primary Action Item
                  </h4>
                  {report.strategic_recommendations && report.strategic_recommendations.length > 0 ? (
                    <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 'var(--radius-sm)' }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>
                        {report.strategic_recommendations[0].title}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {report.strategic_recommendations[0].description}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>None listed</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
