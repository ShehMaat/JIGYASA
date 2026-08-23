'use client';

import React, { useState, useEffect } from 'react';
import { MarketReport } from '../../types/intelligence';

interface PresentationModalProps {
  report: MarketReport;
  onClose: () => void;
}

export default function PresentationModal({ report, onClose }: PresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const overview = report.market_overview || {};
  const swot = report.swot_analysis || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const comps = report.competitor_analysis || [];
  const recs = report.strategic_recommendations || [];
  const risks = report.risk_matrix || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#07090e',
        color: '#f8fafc',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 60px',
      }}
    >
      {/* Top Slide Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--primary-accent)', fontWeight: '800' }}>Alkame Intelligence</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>| Executive Presentation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Slide {currentSlide + 1} of {totalSlides}
          </span>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ✕ Exit (Esc)
          </button>
        </div>
      </div>

      {/* Slide Content Display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        {/* Slide 1: Cover & Executive Summary */}
        {currentSlide === 0 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '900px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Executive Briefing</span>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>
              {report.title}
            </h1>
            <div className="glass-panel" style={{ padding: '32px', borderLeft: '4px solid var(--primary-accent)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary-accent)', marginBottom: '12px' }}>Executive Summary</h3>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
                {report.executive_summary}
              </p>
            </div>
          </div>
        )}

        {/* Slide 2: Market Overview & Sizing */}
        {currentSlide === 1 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '900px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Market Sizing</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>Industry Dynamics & Market Sizing</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>TAM (Total Addressable)</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-accent)' }}>{overview.tam || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SAM (Serviceable)</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--secondary-accent)' }}>{overview.sam || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SOM (Obtainable)</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399' }}>{overview.som || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CAGR</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f59e0b' }}>{overview.cagr || 'N/A'}</p>
              </div>
            </div>

            {overview.key_trends && overview.key_trends.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Key Industry Trends & Catalysts</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {overview.key_trends.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>• {t}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slide 3: Competitor Intelligence Matrix */}
        {currentSlide === 2 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '960px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Competitive Benchmarks</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>Competitor Battlecard Matrix</h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Competitor</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Position</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Est. Share</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Pricing Strategy</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Target Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '14px', fontWeight: '600', color: 'var(--primary-accent)' }}>{c.name}</td>
                      <td style={{ padding: '14px' }}>{c.market_position}</td>
                      <td style={{ padding: '14px', fontWeight: '600' }}>{c.estimated_market_share}</td>
                      <td style={{ padding: '14px', fontSize: '0.85rem' }}>{c.pricing_strategy}</td>
                      <td style={{ padding: '14px', fontSize: '0.85rem' }}>{c.target_segment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide 4: SWOT Grid */}
        {currentSlide === 3 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '960px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Strategic Assessment</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>SWOT Analysis Grid</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #34d399' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#34d399', marginBottom: '10px' }}>💪 Strengths</h3>
                {swot.strengths.map((s, i) => <p key={i} style={{ fontSize: '0.85rem', marginBottom: '6px' }}>• {s}</p>)}
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #f87171' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#f87171', marginBottom: '10px' }}>⚠️ Weaknesses</h3>
                {swot.weaknesses.map((w, i) => <p key={i} style={{ fontSize: '0.85rem', marginBottom: '6px' }}>• {w}</p>)}
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #60a5fa' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#60a5fa', marginBottom: '10px' }}>🚀 Opportunities</h3>
                {swot.opportunities.map((o, i) => <p key={i} style={{ fontSize: '0.85rem', marginBottom: '6px' }}>• {o}</p>)}
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #fbbf24' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24', marginBottom: '10px' }}>🛡️ Threats</h3>
                {swot.threats.map((t, i) => <p key={i} style={{ fontSize: '0.85rem', marginBottom: '6px' }}>• {t}</p>)}
              </div>
            </div>
          </div>
        )}

        {/* Slide 5: Action Roadmap */}
        {currentSlide === 4 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '900px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Execution Plan</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>Strategic Recommendations</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {recs.map((r, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{r.title}</h3>
                    <span className="badge badge-primary">{r.priority} Priority | {r.timeframe}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{r.description}</p>
                  <p style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: '600' }}>Impact: {r.expected_impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide 6: Risk Matrix */}
        {currentSlide === 5 && (
          <div className="animate-in" style={{ width: '100%', maxWidth: '900px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>Governance</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>Risk Assessment & Mitigation</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {risks.map((rk, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{rk.risk_title}</h3>
                    <span className="badge badge-danger">Severity: {rk.severity} | Likelihood: {rk.likelihood}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Mitigation: {rk.mitigation_strategy}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
        <button
          className="btn-secondary"
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
        >
          ← Previous Slide
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: currentSlide === i ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
          disabled={currentSlide === totalSlides - 1}
        >
          Next Slide →
        </button>
      </div>
    </div>
  );
}
