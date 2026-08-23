'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { intelligenceApi } from '../../services/api';
import { TaskStatusResponse } from '../../types/intelligence';

const FOCUS_OPTIONS = [
  { key: 'pricing', label: '💰 Pricing', desc: 'Pricing models & tiers' },
  { key: 'features', label: '⚡ Features', desc: 'Product capabilities' },
  { key: 'market_share', label: '📊 Market Share', desc: 'Market positioning' },
  { key: 'gtm_strategy', label: '🚀 GTM Strategy', desc: 'Go-to-market approach' },
  { key: 'technology', label: '🔧 Technology', desc: 'Tech stack & architecture' },
  { key: 'funding', label: '💵 Funding', desc: 'Funding & financials' },
];

export default function ResearchPage() {
  const router = useRouter();

  // Form
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'comprehensive'>('standard');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'pricing', 'features', 'market_share', 'gtm_strategy',
  ]);

  // Execution
  const [currentTask, setCurrentTask] = useState<TaskStatusResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const list = await intelligenceApi.listProjects();
        setProjects(list);
      } catch {
        // fallback
      }
    }
    fetchProjects();
  }, []);

  // Poll task
  useEffect(() => {
    if (!currentTask || currentTask.status === 'COMPLETED' || currentTask.status === 'FAILED') {
      return;
    }

    // Use Server-Sent Events (SSE) for real-time live streaming log events
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/research/tasks/${currentTask.id}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          setCurrentTask((prev) => {
            if (!prev) return prev;
            const logs = prev.logs || [];
            if (!logs.includes(data.log)) {
              return {
                ...prev,
                status: data.status ? data.status.toUpperCase() : prev.status,
                progress_percentage: data.progress || prev.progress_percentage,
                logs: [...logs, data.log],
              };
            }
            return prev;
          });
        }

        if (data.status === 'completed' && data.report_id) {
          setIsRunning(false);
          eventSource.close();
          router.push(`/reports/${data.report_id}`);
        } else if (data.status === 'failed') {
          setIsRunning(false);
          eventSource.close();
        }
      } catch (err) {
        console.warn('SSE message parse error:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    // Fallback polling loop if SSE closes
    const interval = setInterval(async () => {
      try {
        const updated = await intelligenceApi.getTaskStatus(currentTask.id);
        setCurrentTask(updated);

        if (updated.status === 'COMPLETED' && updated.report_id) {
          setIsRunning(false);
          router.push(`/reports/${updated.report_id}`);
        }
        if (updated.status === 'FAILED') {
          setIsRunning(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [currentTask, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry.trim()) return;

    setIsRunning(true);
    setCurrentTask(null);

    const parsedComps = competitors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const task = await intelligenceApi.startResearch({
        company_name: companyName,
        industry: industry,
        target_competitors: parsedComps,
        focus_areas: selectedFocus,
        depth: depth,
        project_id: selectedProjectId || undefined,
      });
      setCurrentTask(task);
    } catch (err) {
      console.error('Failed to start research:', err);
      setIsRunning(false);
    }
  };

  const toggleFocus = (key: string) => {
    setSelectedFocus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="animate-in" style={{ maxWidth: '860px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            New{' '}
            <span className="gradient-text">Research</span>
          </h1>
          <p>Configure and launch an AI-powered market intelligence analysis</p>
        </div>
      </div>

      {/* Research Form */}
      <form onSubmit={handleSubmit}>
        <div
          className="glass-panel animate-in animate-in-delay-1"
          style={{ padding: '28px', marginBottom: '20px' }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px' }}>
            📋 Research Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Target Company *
              </label>
              <input
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Notion, Stripe, Snowflake"
                required
                id="company-name-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Industry / Sector *
              </label>
              <input
                className="input-field"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Productivity SaaS, Fintech, Cloud Data"
                required
                id="industry-input"
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Target Competitors (comma-separated)
            </label>
            <input
              className="input-field"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="e.g. Coda, Confluence, Obsidian, Evernote"
              id="competitors-input"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Assign to Workspace Project (Optional)
            </label>
            <select
              className="input-field"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              id="project-select"
            >
              <option value="">-- Standalone (No Workspace) --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>


          {/* Depth Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Research Depth
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['quick', 'standard', 'comprehensive'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={depth === d ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.82rem', padding: '8px 16px', textTransform: 'capitalize' }}
                >
                  {d === 'quick' && '⚡ '}
                  {d === 'standard' && '📊 '}
                  {d === 'comprehensive' && '🔬 '}
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Focus Areas
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleFocus(opt.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${
                      selectedFocus.includes(opt.key) ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)'
                    }`,
                    background: selectedFocus.includes(opt.key)
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'transparent',
                    color: selectedFocus.includes(opt.key)
                      ? 'var(--primary-accent)'
                      : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          type="submit"
          className="btn-primary animate-in animate-in-delay-2"
          disabled={isRunning || !companyName.trim() || !industry.trim()}
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '16px',
            fontSize: '1.05rem',
          }}
          id="launch-research-btn"
        >
          {isRunning ? '⏳ Agent Running...' : '🚀 Launch Market Intelligence Agent'}
        </button>
      </form>

      {/* Live Agent Execution Monitor */}
      {currentTask && (
        <div
          className="glass-panel animate-in"
          style={{ marginTop: '24px', padding: '24px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
              🤖 Agent Execution Monitor
            </h3>
            <span
              className={`badge ${
                currentTask.status === 'COMPLETED'
                  ? 'badge-success'
                  : currentTask.status === 'FAILED'
                  ? 'badge-danger'
                  : 'badge-warning'
              }`}
            >
              {currentTask.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentTask.current_step}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--primary-accent)', fontWeight: '600' }}>
                {currentTask.progress_percentage}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${currentTask.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Agent Logs */}
          <div className="terminal-box">
            {(currentTask.logs || []).map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                <span style={{ color: log.level === 'error' ? '#ef4444' : '#38bdf8' }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>

          {currentTask.status === 'FAILED' && currentTask.error_message && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              ❌ {currentTask.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
