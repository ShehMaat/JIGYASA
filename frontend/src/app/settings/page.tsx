'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [tab, setTab] = useState<'overview' | 'api_docs'>('overview');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  const docsUrl = apiUrl.replace('/api/v1', '/docs');

  return (
    <div className="animate-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <h1>
            <span className="gradient-text">Settings & Developer Portal</span>
          </h1>
          <p>Configure AI Engine parameters & test REST API endpoints interactively</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          ⚙️ System Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'api_docs' ? 'active' : ''}`}
          onClick={() => setTab('api_docs')}
          id="api-docs-tab"
        >
          📖 Interactive OpenAPI Explorer
        </button>
      </div>

      {tab === 'overview' ? (
        <div style={{ maxWidth: '720px' }}>
          {/* LLM Configuration */}
          <div className="glass-panel animate-in animate-in-delay-1" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>🤖 AI Engine Configuration</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                LLM Provider
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input className="input-field" value="Groq Cloud (Low Latency 120B+ LLM)" readOnly style={{ maxWidth: '320px', opacity: 0.8 }} />
                <span className="badge badge-success">Connected</span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Primary Model
              </label>
              <input className="input-field" value="llama-3.3-70b-versatile" readOnly style={{ maxWidth: '320px', opacity: 0.8 }} />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Fallback Model Try Chain
              </label>
              <input className="input-field" value="llama-3.1-8b-instant → mixtral-8x7b → gemma2-9b-it" readOnly style={{ maxWidth: '420px', opacity: 0.8 }} />
            </div>
          </div>

          {/* API Info */}
          <div className="glass-panel animate-in animate-in-delay-2" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>🔗 REST API Engine</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Backend Base Endpoint
              </label>
              <input className="input-field" value={apiUrl} readOnly style={{ maxWidth: '420px', opacity: 0.8 }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Swagger OpenAPI Docs
              </label>
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-accent)', fontSize: '0.88rem' }}>
                🔗 Open {docsUrl} in new tab
              </a>
            </div>
          </div>

          {/* Web Crawler */}
          <div className="glass-panel animate-in animate-in-delay-3" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>🌐 Live Web Crawler Configuration</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
              Dual-package DuckDuckGo crawler engine (`ddgs` / `duckduckgo_search`) with rate-limit burst delays, exponential backoff retries, and domain text extraction.
            </p>
            <span className="badge badge-primary">Status: Active & Operational</span>
          </div>
        </div>
      ) : (
        /* Interactive OpenAPI Swagger Iframe */
        <div className="glass-panel animate-in" style={{ height: '700px', overflow: 'hidden', padding: '0' }}>
          <iframe
            src={docsUrl}
            title="JIGYASA OpenAPI Swagger Documentation"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      )}
    </div>
  );
}
