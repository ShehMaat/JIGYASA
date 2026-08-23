'use client';

import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/api';

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'overview' | 'api_docs' | 'webhooks'>('overview');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  const docsUrl = apiUrl.replace('/api/v1', '/docs');

  // Webhook management state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (tab === 'webhooks') {
      loadWebhooks();
    }
  }, [tab]);

  async function loadWebhooks() {
    const list = await intelligenceApi.listWebhooks();
    setWebhooks(list || []);
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !url) return;

    const res = await intelligenceApi.createWebhook({
      name,
      url,
      events: ['task.completed', 'competitor.alert'],
    });

    if (res) {
      setName('');
      setUrl('');
      loadWebhooks();
    }
  }

  async function handleTestWebhook(id: string) {
    setTestingId(id);
    setTestResult(null);
    const res = await intelligenceApi.testWebhook(id);
    setTestingId(null);

    if (res && res.success) {
      setTestResult({ success: true, message: `Ping delivered successfully (HTTP ${res.status_code})` });
    } else {
      setTestResult({ success: false, message: `Ping failed: ${res?.error || 'Target endpoint unreachable'}` });
    }
  }

  async function handleDeleteWebhook(id: string) {
    const ok = await intelligenceApi.deleteWebhook(id);
    if (ok) {
      loadWebhooks();
    }
  }

  return (
    <div className="animate-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <h1>
            <span className="gradient-text">Settings & Developer Portal</span>
          </h1>
          <p>Configure AI Engine parameters, test API endpoints, and manage webhooks</p>
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
        <button
          type="button"
          className={`tab-btn ${tab === 'webhooks' ? 'active' : ''}`}
          onClick={() => setTab('webhooks')}
          id="webhooks-tab"
        >
          🔔 Webhooks & Integrations
        </button>
      </div>

      {tab === 'overview' && (
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
      )}

      {tab === 'api_docs' && (
        /* Interactive OpenAPI Swagger Iframe */
        <div className="glass-panel animate-in" style={{ height: '700px', overflow: 'hidden', padding: '0' }}>
          <iframe
            src={docsUrl}
            title="JIGYASA OpenAPI Swagger Documentation"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="animate-in" style={{ maxWidth: '800px' }}>
          {/* Webhook Subscription Form */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>➕ Register New Webhook Endpoint</h3>
            <form onSubmit={handleCreateWebhook} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Integration Name
                </label>
                <input
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Slack Market Alerts"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Target Webhook URL
                </label>
                <input
                  className="input-field"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00/B00/X00"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }}>
                🔗 Register Webhook
              </button>
            </form>
          </div>

          {/* Test Ping Feedback Alert */}
          {testResult && (
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                marginBottom: '20px',
                borderLeft: `4px solid ${testResult.success ? '#34d399' : '#f87171'}`,
              }}
            >
              <p style={{ fontSize: '0.88rem', fontWeight: '600', color: testResult.success ? '#34d399' : '#f87171' }}>
                {testResult.success ? '✅ Test Passed' : '❌ Delivery Failed'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{testResult.message}</p>
            </div>
          )}

          {/* Webhook Endpoint List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>📡 Active Webhook Subscriptions</h3>

            {webhooks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>No active webhooks configured yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {webhooks.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-accent)' }}>{w.name}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0' }}>{w.url}</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        {w.events.map((ev, i) => (
                          <span key={i} className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleTestWebhook(w.id)}
                        disabled={testingId === w.id}
                      >
                        {testingId === w.id ? '⏳ Testing...' : '🧪 Test Ping'}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f87171' }}
                        onClick={() => handleDeleteWebhook(w.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
