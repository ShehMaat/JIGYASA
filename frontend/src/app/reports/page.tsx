'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../services/api';
import { MarketReport } from '../../types/intelligence';

export default function ReportsListPage() {
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MarketReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const list = await intelligenceApi.listReports();
        setReports(list);
        setFilteredReports(list);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredReports(
        reports.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.executive_summary?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, reports]);

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    await intelligenceApi.deleteReport(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Report{' '}
            <span className="gradient-text">History</span>
          </h1>
          <p>Browse and manage all generated market intelligence dossiers</p>
        </div>
        <Link href="/research">
          <button className="btn-primary">🔬 New Research</button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <input
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search reports by title or content..."
          style={{ maxWidth: '480px' }}
          id="search-reports-input"
        />
      </div>

      {/* Stats Bar */}
      <div
        className="animate-in animate-in-delay-1"
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span className="badge badge-primary">
          {filteredReports.length} Reports
        </span>
        <span className="badge badge-success">
          {reports.reduce((s, r) => s + (r.competitor_analysis?.length || 0), 0)} Competitors Tracked
        </span>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '180px', borderRadius: 'var(--radius-md)' }}
            />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div
          className="glass-panel"
          style={{ padding: '48px', textAlign: 'center' }}
        >
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</p>
          <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>
            {searchQuery ? 'No Matching Reports' : 'No Reports Yet'}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>
            {searchQuery
              ? 'Try adjusting your search terms.'
              : 'Launch your first research to generate intelligence dossiers.'}
          </p>
          {!searchQuery && (
            <Link href="/research">
              <button className="btn-primary">🔬 Launch Research</button>
            </Link>
          )}
        </div>
      ) : (
        <div
          className="animate-in animate-in-delay-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredReports.map((report) => (
            <div key={report.id} className="glass-panel report-card">
              <Link
                href={`/reports/${report.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    lineHeight: '1.3',
                    marginBottom: '8px',
                  }}
                >
                  {report.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    marginBottom: '14px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {report.executive_summary}
                </p>

                {/* Meta Stats */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span className="badge badge-primary">
                    {report.competitor_analysis?.length || 0} Competitors
                  </span>
                  <span className="badge badge-warning">
                    {report.strategic_recommendations?.length || 0} Actions
                  </span>
                  {report.market_overview?.tam && (
                    <span className="badge badge-success">
                      TAM: {report.market_overview.tam}
                    </span>
                  )}
                </div>
              </Link>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  {new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  className="btn-danger"
                  style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(report.id);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
