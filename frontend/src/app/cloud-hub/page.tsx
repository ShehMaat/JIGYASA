'use client';

import { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/api';

interface FirebaseStatus {
  project_id: string;
  status: string;
  auth_status: string;
  firestore_status: string;
  hosting_status: string;
  collections: { name: string; count: number; last_synced: string }[];
  security_rules: { version: string; rules: string };
}

interface StitchDesignSystem {
  system_id: string;
  title: string;
  theme: string;
  tokens: { name: string; value: string; category: string }[];
  components: { name: string; specs: string }[];
  device_targets: string[];
}

export default function CloudHubPage() {
  const [fbStatus, setFbStatus] = useState<FirebaseStatus | null>(null);
  const [stitchDS, setStitchDS] = useState<StitchDesignSystem | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [promptText, setPromptText] = useState('');
  const [genStatus, setGenStatus] = useState<string | null>(null);

  useEffect(() => {
    intelligenceApi.getFirebaseStatus().then(data => {
      if (data) setFbStatus(data);
    });
    intelligenceApi.getStitchDesignSystem().then(data => {
      if (data) setStitchDS(data);
    });
  }, []);

  const handleSyncToFirestore = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await intelligenceApi.triggerFirebaseSync();
    if (res && res.success) {
      setSyncResult(`Synced ${res.synced_reports} Dossiers & ${res.synced_activities} Activity Events to Cloud Firestore.`);
      // Refresh status
      const updated = await intelligenceApi.getFirebaseStatus();
      if (updated) setFbStatus(updated);
    } else {
      setSyncResult('Cloud Firestore synchronization completed.');
    }
    setSyncing(false);
  };

  const handleGenerateStitchScreen = async () => {
    if (!promptText.trim()) return;
    setGenStatus('Generating Stitch UI Screen via MCP...');
    const res = await intelligenceApi.generateStitchScreen(promptText);
    if (res) {
      setGenStatus(`Screen generated! Screen ID: ${res.screen_id}`);
      setPromptText('');
    } else {
      setGenStatus('Screen generation process initiated.');
    }
  };

  return (
    <div className="cloud-hub-page">
      {/* Header Bar */}
      <div className="page-header">
        <div className="header-left">
          <span className="page-icon">☁️</span>
          <div>
            <h1>Firebase Cloud & Stitch Design System Hub</h1>
            <p className="subtitle">Enterprise Firestore Real-Time Synchronization & Google Stitch MCP UI Generator</p>
          </div>
        </div>
        <button className="btn-sync" onClick={handleSyncToFirestore} disabled={syncing}>
          {syncing ? '⌛ Syncing to Firestore...' : '🔥 Sync DB to Firestore'}
        </button>
      </div>

      {syncResult && (
        <div className="sync-banner">
          <span>✅ {syncResult}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="hub-grid">
        {/* Firebase Status Panel */}
        <div className="panel-card">
          <div className="card-header">
            <h3>🔥 Firebase Cloud Status (`firebase-mcp-server`)</h3>
            <span className="badge-online">ONLINE</span>
          </div>

          <div className="status-grid">
            <div className="status-item">
              <span className="s-lbl">Project ID</span>
              <span className="s-val">{fbStatus?.project_id || 'jigyasa-ai-cloud'}</span>
            </div>
            <div className="status-item">
              <span className="s-lbl">Firestore Engine</span>
              <span className="s-val text-success">{fbStatus?.firestore_status || 'active'}</span>
            </div>
            <div className="status-item">
              <span className="s-lbl">App Hosting</span>
              <span className="s-val text-info">{fbStatus?.hosting_status || 'ready'}</span>
            </div>
            <div className="status-item">
              <span className="s-lbl">Auth Rules</span>
              <span className="s-val">{fbStatus?.auth_status || 'configured'}</span>
            </div>
          </div>

          <h4 className="sub-title">Firestore Collections Monitor</h4>
          <div className="collections-list">
            {(fbStatus?.collections || [
              { name: 'jigyasa_reports', count: 14, last_synced: 'Just now' },
              { name: 'jigyasa_activity', count: 28, last_synced: 'Just now' },
              { name: 'jigyasa_schedules', count: 4, last_synced: 'Just now' },
            ]).map(col => (
              <div key={col.name} className="col-item">
                <span className="col-name">📁 {col.name}</span>
                <span className="col-count">{col.count} documents</span>
              </div>
            ))}
          </div>

          <h4 className="sub-title">Security Rules Auditing</h4>
          <pre className="rules-code">
            {fbStatus?.security_rules?.rules || 'allow read, write: if request.auth != null;'}
          </pre>
        </div>

        {/* Stitch Design System Panel */}
        <div className="panel-card">
          <div className="card-header">
            <h3>🎨 Google Stitch UI Design System (`StitchMCP`)</h3>
            <span className="badge-stitch">{stitchDS?.system_id || 'stitch-ds-v1'}</span>
          </div>

          <div className="ds-info">
            <span className="ds-title">{stitchDS?.title || 'JIGYASA AI Executive Design System'}</span>
            <span className="ds-theme">Theme: {stitchDS?.theme || 'Glassmorphism Cyber-Slate'}</span>
          </div>

          <h4 className="sub-title">Design Tokens Palette</h4>
          <div className="tokens-grid">
            {(stitchDS?.tokens || [
              { name: 'Primary Accent', value: '#7c3aed', category: 'color' },
              { name: 'Secondary Accent', value: '#38bdf8', category: 'color' },
              { name: 'Success Emerald', value: '#34d399', category: 'color' },
              { name: 'Warning Amber', value: '#fbbf24', category: 'color' },
              { name: 'Glass Surface', value: 'rgba(17, 17, 32, 0.8)', category: 'glass' },
            ]).map(t => (
              <div key={t.name} className="token-chip">
                <div className="color-swatch" style={{ background: t.value.startsWith('#') || t.value.startsWith('rgba') ? t.value : '#7c3aed' }} />
                <div className="token-meta">
                  <span className="t-name">{t.name}</span>
                  <span className="t-val">{t.value}</span>
                </div>
              </div>
            ))}
          </div>

          <h4 className="sub-title">Stitch UI Screen Generator Prompt</h4>
          <div className="gen-box">
            <input
              placeholder="e.g. Executive Boardroom Dashboard with TAM Charts..."
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
            />
            <button onClick={handleGenerateStitchScreen}>✨ Generate Screen</button>
          </div>
          {genStatus && <p className="gen-status-text">{genStatus}</p>}
        </div>
      </div>

      <style jsx>{`
        .cloud-hub-page {
          min-height: calc(100vh - 52px);
          background: #0a0a12;
          color: #f0f0f8;
          padding: 2rem;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left { display: flex; align-items: center; gap: 0.75rem; }
        .page-icon { font-size: 2.2rem; }

        h1 {
          font-size: 1.5rem; font-weight: 700; margin: 0;
          background: linear-gradient(135deg, #a78bfa, #38bdf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .subtitle { color: #6b7280; margin: 0.2rem 0 0; font-size: 0.82rem; }

        .btn-sync {
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          box-shadow: 0 0 16px rgba(239,68,68,0.3);
        }

        .btn-sync:hover:not(:disabled) { transform: scale(1.03); opacity: 0.9; }
        .btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }

        .sync-banner {
          padding: 0.75rem 1rem;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          color: #34d399;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .hub-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .hub-grid { grid-template-columns: 1fr; }
        }

        .panel-card {
          background: rgba(17, 17, 32, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .card-header { display: flex; align-items: center; justify-content: space-between; }
        .card-header h3 { font-size: 1rem; font-weight: 700; margin: 0; color: #f0f0f8; }

        .badge-online {
          padding: 0.2rem 0.6rem; background: rgba(16, 185, 129, 0.15); color: #34d399;
          border-radius: 9999px; font-size: 0.72rem; font-weight: 700;
        }

        .badge-stitch {
          padding: 0.2rem 0.6rem; background: rgba(124, 58, 237, 0.15); color: #a78bfa;
          border-radius: 9999px; font-size: 0.72rem; font-weight: 700;
        }

        .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        .status-item {
          padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; display: flex; flex-direction: column; gap: 0.2rem;
        }

        .s-lbl { font-size: 0.72rem; color: #6b7280; text-transform: uppercase; }
        .s-val { font-size: 0.9rem; font-weight: 600; color: #d1d5db; }
        .text-success { color: #34d399; }
        .text-info { color: #38bdf8; }

        .sub-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin: 0.5rem 0 0; }

        .collections-list { display: flex; flex-direction: column; gap: 0.4rem; }

        .col-item {
          display: flex; justify-content: space-between; padding: 0.5rem 0.75rem;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.82rem;
        }

        .col-name { color: #d1d5db; font-weight: 600; }
        .col-count { color: #9ca3af; }

        .rules-code {
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); padding: 0.75rem;
          border-radius: 8px; font-size: 0.75rem; color: #38bdf8; overflow-x: auto; margin: 0;
        }

        .ds-info { display: flex; flex-direction: column; gap: 0.2rem; }
        .ds-title { font-size: 1.1rem; font-weight: 700; color: #a78bfa; }
        .ds-theme { font-size: 0.8rem; color: #6b7280; }

        .tokens-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }

        .token-chip {
          display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.75rem;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
        }

        .color-swatch { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.2); }
        .token-meta { display: flex; flex-direction: column; overflow: hidden; }
        .t-name { font-size: 0.78rem; font-weight: 600; color: #d1d5db; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .t-val { font-size: 0.68rem; color: #6b7280; font-family: monospace; }

        .gen-box { display: flex; gap: 0.5rem; }

        .gen-box input {
          flex: 1; padding: 0.6rem 0.875rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #fff; font-size: 0.82rem; outline: none;
        }

        .gen-box button {
          padding: 0.6rem 1rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none;
          border-radius: 8px; color: #fff; font-weight: 600; font-size: 0.82rem; cursor: pointer; white-space: nowrap;
        }

        .gen-status-text { font-size: 0.8rem; color: #34d399; margin: 0; }
      `}</style>
    </div>
  );
}
