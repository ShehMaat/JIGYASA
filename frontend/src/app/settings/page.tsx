'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="animate-in" style={{ maxWidth: '700px' }}>
      <div className="page-header">
        <div>
          <h1>
            <span className="gradient-text">Settings</span>
          </h1>
          <p>Configure your Alkame Intelligence platform</p>
        </div>
      </div>

      {/* LLM Configuration */}
      <div className="glass-panel animate-in animate-in-delay-1" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>🤖 AI Engine Configuration</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            LLM Provider
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input className="input-field" value="Groq" readOnly style={{ maxWidth: '200px', opacity: 0.7 }} />
            <span className="badge badge-success">Connected</span>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Primary Model
          </label>
          <input className="input-field" value="llama-3.3-70b-versatile" readOnly style={{ maxWidth: '320px', opacity: 0.7 }} />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Fallback Model
          </label>
          <input className="input-field" value="llama-3.1-8b-instant" readOnly style={{ maxWidth: '320px', opacity: 0.7 }} />
        </div>
      </div>

      {/* API Info */}
      <div className="glass-panel animate-in animate-in-delay-2" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>🔗 API Configuration</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Backend API URL
          </label>
          <input className="input-field" value="http://localhost:8000/api/v1" readOnly style={{ opacity: 0.7 }} />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Web Search Engine
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input className="input-field" value="DuckDuckGo (DDGS)" readOnly style={{ maxWidth: '250px', opacity: 0.7 }} />
            <span className="badge badge-primary">Live Search</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-panel animate-in animate-in-delay-3" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>📚 Quick Links</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
            📖 API Documentation
          </button>
          <button className="btn-secondary" onClick={() => window.open('http://localhost:8000/redoc', '_blank')}>
            📑 ReDoc Viewer
          </button>
          <button className="btn-secondary" onClick={() => window.open('https://github.com/ShehMaat/Alkame-Intelligence-', '_blank')}>
            🐙 GitHub Repo
          </button>
        </div>
      </div>
    </div>
  );
}
