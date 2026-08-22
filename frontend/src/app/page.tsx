'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../services/api';
import { MarketReport } from '../types/intelligence';

export default function DashboardPage() {
  const [recentReports, setRecentReports] = useState<MarketReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await intelligenceApi.listReports();
        setRecentReports(list);
      } catch {
        // fallback empty
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalCompetitors = recentReports.reduce(
    (sum, r) => sum + (r.competitor_analysis?.length || 0),
    0
  );

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Dashboard{' '}
            <span style={{ color: 'var(--primary-accent)', fontWeight: '400' }}>Overview</span>
          </h1>
          <p>Your market intelligence command center</p>
        </div>
        <Link href="/research">
          <button className="btn-primary" id="new-research-btn">
            🔬 New Research
          </button>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <section
        className="animate-in animate-in-delay-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            Total Reports
          </p>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              lineHeight: '1',
            }}
          >
            {recentReports.length}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--secondary-accent)' }}>
            Market Dossiers Generated
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            Competitors Tracked
          </p>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--primary-accent)',
              lineHeight: '1',
            }}
          >
            {totalCompetitors}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            Across All Reports
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            AI Engine
          </p>
          <p
            style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'var(--success)',
              lineHeight: '1.4',
            }}
          >
            Groq Llama 3.3 70B
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            + DuckDuckGo Live Search
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            Platform Status
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--success)' }}>
              Online
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>All Systems Operational</span>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="animate-in animate-in-delay-2">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Recent Intelligence Reports</h2>
          <Link
            href="/reports"
            style={{
              color: 'var(--primary-accent)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '500',
            }}
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '160px', borderRadius: 'var(--radius-md)' }}
              />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</p>
            <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>
              No Reports Yet
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>
              Start your first market research to generate actionable intelligence.
            </p>
            <Link href="/research">
              <button className="btn-primary">🔬 Launch Research</button>
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {recentReports.slice(0, 6).map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="glass-panel report-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        lineHeight: '1.3',
                        flex: 1,
                      }}
                    >
                      {report.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {report.executive_summary}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-primary">
                        {report.competitor_analysis?.length || 0} Competitors
                      </span>
                      {report.market_overview?.cagr && (
                        <span className="badge badge-success">
                          {report.market_overview.cagr.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="animate-in animate-in-delay-3" style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/research">
            <button className="btn-secondary">🔬 New Market Research</button>
          </Link>
          <Link href="/reports">
            <button className="btn-secondary">📋 Browse Reports</button>
          </Link>
          <button
            className="btn-secondary"
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
          >
            📖 API Docs
          </button>
        </div>
      </section>
    </div>
  );
}
