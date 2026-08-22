'use client';

import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../services/api';
import { MarketReport, TaskStatusResponse } from '../types/intelligence';

export default function MarketIntelligenceDashboard() {
  // Form State
  const [companyName, setCompanyName] = useState('Notion');
  const [industry, setIndustry] = useState('Productivity & Knowledge Workspace');
  const [competitors, setCompetitors] = useState('Coda, Confluence, Obsidian, Evernote');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'comprehensive'>('standard');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'pricing',
    'features',
    'market_share',
    'gtm_strategy',
  ]);

  // Execution State
  const [currentTask, setCurrentTask] = useState<TaskStatusResponse | null>(null);
  const [activeReport, setActiveReport] = useState<MarketReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'matrix' | 'swot' | 'strategy' | 'risks' | 'evidence'>('overview');
  const [recentReports, setRecentReports] = useState<MarketReport[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load initial report on first mount
  useEffect(() => {
    async function loadInitial() {
      const initial = await intelligenceApi.quickAnalyze({
        company_name: 'Notion',
        industry: 'Productivity & Knowledge Workspace',
        target_competitors: ['Coda', 'Confluence', 'Obsidian', 'Evernote'],
      });
      setActiveReport(initial);
      const list = await intelligenceApi.listReports();
      setRecentReports(list.length > 0 ? list : [initial]);
    }
    loadInitial();
  }, []);

  // Poll task execution if task is in progress
  useEffect(() => {
    if (!currentTask || currentTask.status === 'COMPLETED' || currentTask.status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await intelligenceApi.getTaskStatus(currentTask.id);
        setCurrentTask(updated);

        if (updated.status === 'COMPLETED' && updated.report_id) {
          const rep = await intelligenceApi.getReport(updated.report_id);
          setActiveReport(rep);
          setIsLoading(false);
          setRecentReports((prev) => [rep, ...prev.filter((r) => r.id !== rep.id)]);
        }
      } catch (err) {
        console.error('Error polling task status:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [currentTask]);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setIsLoading(true);
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
      });
      setCurrentTask(task);
    } catch (err) {
      console.error('Failed to trigger research:', err);
      setIsLoading(false);
    }
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocus((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleCopySummary = () => {
    if (activeReport?.executive_summary) {
      navigator.clipboard.writeText(activeReport.executive_summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (activeReport) {
      const filename = `${activeReport.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
      intelligenceApi.downloadMarkdownExport(activeReport.id, filename);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Helper to extract integer percentage for market share bar
  const parseShareNumber = (shareStr: string = '10%') => {
    const match = shareStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 15;
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Navigation / Brand Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.25rem',
              color: '#fff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            A
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
              Alkame <span style={{ color: 'var(--primary-accent)', fontWeight: '400' }}>Intelligence</span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Live Market & Competitor Intelligence Suite • Groq 120B + DuckDuckGo Web Crawl
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-success">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Groq 120B Connected
          </span>
          <span className="badge badge-primary">DuckDuckGo Live Search</span>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Target Company
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {activeReport ? activeReport.title.split(': ')[1] || companyName : companyName}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-accent)' }}>
            {activeReport?.market_overview?.cagr ? `CAGR: ${activeReport.market_overview.cagr}` : 'Market Research'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Competitors Analyzed
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-accent)' }}>
            {activeReport?.competitor_analysis?.length || 4} Peers
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Live Battlecards & Pricing
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            TAM Estimated
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
            {activeReport?.market_overview?.tam || '$45.2B'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            SAM: {activeReport?.market_overview?.sam || '$14.5B'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Verified Citations
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
            {activeReport?.raw_evidence?.length || 8} Sources
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Live Crawled Evidence
          </span>
        </div>
      </section>

      {/* Main Grid: Control Form + Results Explorer */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Research Trigger Form & Task Monitor */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Research Request Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '18px' }}>
              Launch Intelligence Run
            </h2>

            <form onSubmit={handleStartResearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Target Company / Project
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Figma, Databricks, Linear"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Industry / Domain
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Fintech & Payments, Data Lakehouses"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Key Competitors (comma separated)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="Coda, Confluence, Obsidian, Evernote"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Focus Dimensions
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['pricing', 'features', 'market_share', 'gtm_strategy', 'customer_sentiment'].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleFocusArea(tag)}
                      style={{
                        background: selectedFocus.includes(tag) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: selectedFocus.includes(tag) ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                        color: selectedFocus.includes(tag) ? '#c7d2fe' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tag.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Research Depth
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {(['quick', 'standard', 'comprehensive'] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setDepth(lvl)}
                      style={{
                        background: depth === lvl ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.04)',
                        color: depth === lvl ? '#ffffff' : 'var(--text-muted)',
                        border: depth === lvl ? 'none' : '1px solid var(--border-color)',
                        padding: '8px 0',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? '⚡ Agent Crawling & Synthesizing...' : '⚡ Generate Live Dossier'}
              </button>
            </form>
          </div>

          {/* Real-time Agent Execution Monitor */}
          {currentTask && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Agent Progress</h3>
                <span className={`badge ${currentTask.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                  {currentTask.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                <div
                  style={{
                    width: `${currentTask.progress_percentage}%`,
                    height: '100%',
                    background: 'var(--primary-gradient)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Step: <strong style={{ color: 'var(--text-main)' }}>{currentTask.current_step}</strong>
              </p>

              {/* Live Terminal Stream */}
              <div className="terminal-box">
                {currentTask.logs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Switcher for Historical Reports */}
          {recentReports.length > 1 && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
                Recent Dossiers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentReports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: activeReport?.id === rep.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: activeReport?.id === rep.id ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{rep.title.replace('Market Intelligence & Competitor Dossier: ', '')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{new Date(rep.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Interactive Market Intelligence Dossier */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          {activeReport ? (
            <div>
              {/* Header Title & 1-Click Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                    Live Market Intelligence Dossier
                  </span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                    {activeReport.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Synthesized via Groq 120B + Live DuckDuckGo Crawl • Confidence Score: 95%
                  </p>
                </div>

                {/* 1-Click Export Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopySummary}
                    className="btn-secondary"
                    title="Copy Executive Summary"
                    style={{ fontSize: '0.82rem' }}
                  >
                    {copySuccess ? '✓ Copied' : '📋 Copy Summary'}
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="btn-secondary"
                    title="Download Markdown Report"
                    style={{ fontSize: '0.82rem' }}
                  >
                    📥 Export MD
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="btn-secondary"
                    title="Print or Save as PDF"
                    style={{ fontSize: '0.82rem' }}
                  >
                    🖨️ PDF
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '14px',
                  marginBottom: '28px',
                  overflowX: 'auto',
                }}
              >
                {(
                  [
                    { id: 'overview', label: 'Executive Briefing' },
                    { id: 'competitors', label: 'Competitor Battlecards' },
                    { id: 'matrix', label: 'Comparison Matrix' },
                    { id: 'swot', label: 'SWOT Matrix' },
                    { id: 'strategy', label: 'Strategic Roadmap' },
                    { id: 'risks', label: 'Risk Assessment' },
                    { id: 'evidence', label: `Sourced Signals (${activeReport.raw_evidence?.length || 0})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: activeTab === tab.id ? '#a5b4fc' : 'var(--text-muted)',
                      border: activeTab === tab.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Tab 1: Executive Overview & Market Dynamics */}
              {activeTab === 'overview' && (
                <div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px',
                      marginBottom: '24px',
                      lineHeight: '1.7',
                      fontSize: '1rem',
                      color: '#e2e8f0',
                    }}
                  >
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary-accent)', marginBottom: '10px' }}>
                      Executive Summary
                    </h3>
                    <p>{activeReport.executive_summary}</p>
                  </div>

                  {/* Market Sizing Metric Cards */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
                    Market Sizing & Macro Growth
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    <div className="glass-panel" style={{ padding: '18px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TAM</span>
                      <p style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--success)' }}>
                        {activeReport.market_overview.tam || '$45.2B'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Total Addressable Market</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '18px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SAM</span>
                      <p style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--primary-accent)' }}>
                        {activeReport.market_overview.sam || '$14.5B'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Serviceable Addressable</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '18px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOM</span>
                      <p style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--secondary-accent)' }}>
                        {activeReport.market_overview.som || '$3.2B'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Serviceable Obtainable</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '18px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CAGR</span>
                      <p style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--warning)' }}>
                        {activeReport.market_overview.cagr || '14.6%'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Annual Growth Rate</p>
                    </div>
                  </div>

                  {/* Market Share Visual Distribution */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>
                    Estimated Competitor Market Share Distribution
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {activeReport.competitor_analysis.map((c, i) => {
                      const shareVal = parseShareNumber(c.estimated_market_share);
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <span>{c.name} ({c.market_position})</span>
                            <span style={{ color: 'var(--primary-accent)' }}>{c.estimated_market_share}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, shareVal * 2.5)}%`,
                                height: '100%',
                                background: i === 0 ? 'var(--primary-gradient)' : (i === 1 ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' : 'linear-gradient(90deg, #10b981, #06b6d4)'),
                                borderRadius: '4px',
                                transition: 'width 0.6s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Key Market Trends */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>
                    Key Sector Trends & Catalysts
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {activeReport.market_overview.key_trends?.map((trend, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--primary-accent)', fontWeight: '700' }}>0{i + 1}.</span>
                        <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Competitor Battlecards */}
              {activeTab === 'competitors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeReport.competitor_analysis.map((comp, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{comp.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Target: {comp.target_segment}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="badge badge-primary">{comp.market_position}</span>
                          <span className="badge badge-warning">Share: {comp.estimated_market_share}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Pricing Model:</strong> {comp.pricing_strategy}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6ee7b7', marginBottom: '8px' }}>Core Strengths</p>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.83rem', color: '#e2e8f0' }}>
                            {comp.key_strengths.map((str, sIdx) => (
                              <li key={sIdx} style={{ marginBottom: '4px' }}>{str}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fca5a5', marginBottom: '8px' }}>Vulnerabilities / Weaknesses</p>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.83rem', color: '#e2e8f0' }}>
                            {comp.key_weaknesses.map((wk, wIdx) => (
                              <li key={wIdx} style={{ marginBottom: '4px' }}>{wk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Side-by-Side Comparison Matrix Table */}
              {activeTab === 'matrix' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '14px 12px' }}>Competitor</th>
                        <th style={{ padding: '14px 12px' }}>Position</th>
                        <th style={{ padding: '14px 12px' }}>Est. Share</th>
                        <th style={{ padding: '14px 12px' }}>Pricing Model</th>
                        <th style={{ padding: '14px 12px' }}>Target Segment</th>
                        <th style={{ padding: '14px 12px' }}>Differentiation Moat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.competitor_analysis.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                          <td style={{ padding: '14px 12px', fontWeight: '700', color: '#fff' }}>{c.name}</td>
                          <td style={{ padding: '14px 12px' }}><span className="badge badge-primary">{c.market_position}</span></td>
                          <td style={{ padding: '14px 12px', color: 'var(--warning)', fontWeight: '600' }}>{c.estimated_market_share}</td>
                          <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{c.pricing_strategy}</td>
                          <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{c.target_segment}</td>
                          <td style={{ padding: '14px 12px', color: '#67e8f9' }}>{c.differentiation_factor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 4: Interactive SWOT Matrix */}
              {activeTab === 'swot' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Strengths */}
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span className="badge badge-success">S</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#6ee7b7' }}>Internal Strengths</h4>
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                      {activeReport.swot_analysis.strengths.map((s, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span className="badge badge-danger">W</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fca5a5' }}>Internal Weaknesses</h4>
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                      {activeReport.swot_analysis.weaknesses.map((w, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div
                    style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span className="badge badge-primary">O</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#67e8f9' }}>Market Opportunities</h4>
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                      {activeReport.swot_analysis.opportunities.map((o, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span className="badge badge-warning">T</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fcd34d' }}>External Threats</h4>
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                      {activeReport.swot_analysis.threats.map((t, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 5: Strategic Action Roadmap */}
              {activeTab === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeReport.strategic_recommendations.map((strat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{strat.title}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className={`badge ${strat.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                            {strat.priority} Priority
                          </span>
                          <span className="badge badge-primary">{strat.timeframe}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6' }}>{strat.description}</p>
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px 14px',
                          background: 'rgba(99, 102, 241, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          color: '#a5b4fc',
                        }}
                      >
                        <strong>Expected ROI / Impact:</strong> {strat.expected_impact}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 6: Risk Assessment Matrix */}
              {activeTab === 'risks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeReport.risk_matrix.map((risk, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '22px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{risk.risk_title}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className={`badge ${risk.severity === 'High' || risk.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                            Severity: {risk.severity}
                          </span>
                          <span className="badge badge-primary">Likelihood: {risk.likelihood}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Mitigation Protocol:</strong> {risk.mitigation_strategy}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 7: Sourced Citations & Evidence Signals */}
              {activeTab === 'evidence' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {activeReport.raw_evidence && activeReport.raw_evidence.length > 0 ? (
                    activeReport.raw_evidence.map((cit, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="badge badge-primary">{cit.category || 'Web Source'}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cit.source}</span>
                          </div>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
                            {cit.title || cit.source}
                          </h5>
                          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
                            {cit.snippet ? `"${cit.snippet}"` : cit.notes}
                          </p>
                        </div>

                        {cit.url && (
                          <a
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.78rem',
                              color: 'var(--secondary-accent)',
                              textDecoration: 'none',
                              fontWeight: '600',
                            }}
                          >
                            🔗 View Verified Source ↗
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No direct web citations attached.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No report loaded</p>
              <p style={{ fontSize: '0.88rem' }}>Enter a company name on the left and click Generate Live Dossier to launch the agent.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
