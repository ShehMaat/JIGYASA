'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../../../services/api';

interface SlideElement {
  classification?: string;
  date?: string;
  platform?: string;
  bullets?: string[];
  highlight?: string;
  metrics?: { label: string; value: string; color: string }[];
  rows?: { name: string; tier: string; strength: string }[];
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  recommendations?: string[];
}

interface Slide {
  slide_number: int;
  title: string;
  subtitle?: string;
  layout: 'title' | 'bullets' | 'metrics' | 'table' | 'swot' | 'roadmap';
  elements: SlideElement;
  speaker_notes: string;
}

interface DeckData {
  report_id: string;
  report_title: string;
  total_slides: number;
  slides: Slide[];
}

export default function PresentationDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    let mounted = true;
    intelligenceApi.getReportDeck(reportId).then(data => {
      if (!mounted) return;
      if (data) setDeck(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [reportId]);

  const handleNext = useCallback(() => {
    if (!deck) return;
    setCurrentSlideIndex(i => Math.min(i + 1, deck.slides.length - 1));
  }, [deck]);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex(i => Math.max(i - 1, 0));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') { handleNext(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { handlePrev(); e.preventDefault(); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
      if (e.key === 'n' || e.key === 'N') { setShowNotes(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev]);

  // Export standalone HTML deck
  const handleExportHTML = () => {
    if (!deck) return;

    const slidesHTML = deck.slides.map((s, idx) => `
      <section className="slide" id="slide-${idx + 1}">
        <div className="slide-content">
          <span className="badge">${s.subtitle || 'JIGYASA Intelligence'}</span>
          <h1>${s.title}</h1>
          <div className="elements-box">
            ${s.layout === 'bullets' && s.elements.bullets ? `
              <ul className="bullets-list">
                ${s.elements.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            ` : ''}

            ${s.layout === 'metrics' && s.elements.metrics ? `
              <div className="metrics-grid">
                ${s.elements.metrics.map(m => `
                  <div className="metric-card" style="border-left: 4px solid ${m.color}">
                    <div className="m-val" style="color: ${m.color}">${m.value}</div>
                    <div className="m-lbl">${m.label}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${s.layout === 'table' && s.elements.rows ? `
              <table className="deck-table">
                <thead><tr><th>Company</th><th>Tier</th><th>Key Strength</th></tr></thead>
                <tbody>
                  ${s.elements.rows.map(r => `<tr><td><strong>${r.name}</strong></td><td>${r.tier}</td><td>${r.strength}</td></tr>`).join('')}
                </tbody>
              </table>
            ` : ''}

            ${s.layout === 'swot' ? `
              <div className="swot-grid">
                <div className="swot-box s"><h4>Strengths</h4><ul>${(s.elements.strengths || []).map(i => `<li>${i}</li>`).join('')}</ul></div>
                <div className="swot-box w"><h4>Weaknesses</h4><ul>${(s.elements.weaknesses || []).map(i => `<li>${i}</li>`).join('')}</ul></div>
                <div className="swot-box o"><h4>Opportunities</h4><ul>${(s.elements.opportunities || []).map(i => `<li>${i}</li>`).join('')}</ul></div>
                <div className="swot-box t"><h4>Threats</h4><ul>${(s.elements.threats || []).map(i => `<li>${i}</li>`).join('')}</ul></div>
              </div>
            ` : ''}

            ${s.layout === 'roadmap' && s.elements.recommendations ? `
              <ol className="roadmap-list">
                ${s.elements.recommendations.map(r => `<li>${r}</li>`).join('')}
              </ol>
            ` : ''}

            ${s.layout === 'title' ? `
              <div className="cover-meta">
                <p><strong>Classification:</strong> ${s.elements.classification || 'CONFIDENTIAL'}</p>
                <p><strong>Date:</strong> ${s.elements.date || ''}</p>
                <p><strong>Platform:</strong> ${s.elements.platform || 'JIGYASA AI'}</p>
              </div>
            ` : ''}
          </div>
        </div>
        <div className="slide-footer">
          <span>JIGYASA AI Strategic Intelligence</span>
          <span>Slide ${idx + 1} of ${deck.slides.length}</span>
        </div>
      </section>
    `).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${deck.report_title} — Presentation Deck</title>
  <style>
    body { margin: 0; font-family: 'Inter', sans-serif; background: #0a0a12; color: #f0f0f8; }
    .slide { height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 4rem; box-sizing: border-box; border-bottom: 2px solid #7c3aed; }
    h1 { font-size: 2.5rem; background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { background: rgba(124,58,237,0.2); color: #a78bfa; padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.85rem; }
    .bullets-list li { font-size: 1.25rem; margin-bottom: 1rem; color: #d1d5db; }
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
    .metric-card { background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px; }
    .m-val { font-size: 2.2rem; font-weight: bold; }
    .m-lbl { color: #9ca3af; font-size: 0.9rem; margin-top: 0.25rem; }
    .deck-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    .deck-table th, .deck-table td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    .swot-box { padding: 1.25rem; border-radius: 10px; background: rgba(255,255,255,0.03); }
    .swot-box.s { border-left: 4px solid #10b981; } .swot-box.w { border-left: 4px solid #f59e0b; }
    .swot-box.o { border-left: 4px solid #3b82f6; } .swot-box.t { border-left: 4px solid #ef4444; }
    .swot-box h4 { margin: 0 0 0.5rem; }
    .roadmap-list li { font-size: 1.1rem; margin-bottom: 1rem; color: #e5e7eb; }
    .cover-meta p { font-size: 1.1rem; color: #9ca3af; }
    .slide-footer { display: flex; justify-content: space-between; color: #4b5563; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 1rem; }
  </style>
</head>
<body>
  ${slidesHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.report_title.replace(/[^a-z0-9]/gi, '_')}_Deck.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Generating Executive Presentation Deck...</p>
        <style jsx>{`
          .loading-state { min-height: 100vh; background: #0a0a12; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7280; }
          .spinner { width: 40px; height: 40px; border: 3px solid rgba(124,58,237,0.2); border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!deck || deck.slides.length === 0) {
    return (
      <div className="error-state">
        <h3>Could not load presentation deck</h3>
        <Link href={`/reports/${reportId}`} className="btn-back">← Back to Dossier</Link>
        <style jsx>{`
          .error-state { min-height: 100vh; background: #0a0a12; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f0f0f8; }
          .btn-back { color: #7c3aed; text-decoration: none; font-weight: 600; margin-top: 1rem; }
        `}</style>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div className={`deck-page ${theme}`}>
      {/* Top Deck Toolbar */}
      <div className="toolbar">
        <div className="tb-left">
          <Link href={`/reports/${reportId}`} className="tb-back">← Dossier</Link>
          <span className="tb-title">{deck.report_title}</span>
        </div>

        <div className="tb-center">
          <span className="slide-counter">
            Slide {currentSlideIndex + 1} of {deck.slides.length}
          </span>
        </div>

        <div className="tb-right">
          <button className={`tb-btn ${showNotes ? 'active' : ''}`} onClick={() => setShowNotes(p => !p)} title="Toggle Speaker Notes (N)">
            💬 Notes
          </button>
          <button className="tb-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle Light/Dark Theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="tb-btn" onClick={toggleFullscreen} title="Fullscreen Mode (F)">
            {isFullscreen ? '↙ Exit' : '⤢ Present'}
          </button>
          <button className="tb-btn primary" onClick={handleExportHTML} title="Export Standalone HTML Deck">
            💾 Export HTML Deck
          </button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="deck-body">
        {/* Thumbnails Sidebar */}
        <div className="thumbnails-sidebar">
          {deck.slides.map((s, idx) => (
            <button
              key={idx}
              className={`thumb-btn ${idx === currentSlideIndex ? 'active' : ''}`}
              onClick={() => setCurrentSlideIndex(idx)}
            >
              <span className="thumb-num">{idx + 1}</span>
              <span className="thumb-title">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Current Slide Display */}
        <div className="slide-stage">
          <div className="slide-frame">
            <div className="slide-header">
              <span className="slide-subtitle">{currentSlide.subtitle || 'JIGYASA AI Strategic Briefing'}</span>
              <h1 className="slide-title">{currentSlide.title}</h1>
            </div>

            <div className="slide-content">
              {/* Bullets Layout */}
              {currentSlide.layout === 'bullets' && currentSlide.elements.bullets && (
                <ul className="bullets-list">
                  {currentSlide.elements.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}

              {/* Metrics Layout */}
              {currentSlide.layout === 'metrics' && currentSlide.elements.metrics && (
                <div className="metrics-grid">
                  {currentSlide.elements.metrics.map((m, i) => (
                    <div key={i} className="metric-card" style={{ borderLeftColor: m.color }}>
                      <div className="m-val" style={{ color: m.color }}>{m.value}</div>
                      <div className="m-lbl">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table Layout */}
              {currentSlide.layout === 'table' && currentSlide.elements.rows && (
                <table className="deck-table">
                  <thead>
                    <tr><th>Company / Competitor</th><th>Tier</th><th>Key Strategic Strength</th></tr>
                  </thead>
                  <tbody>
                    {currentSlide.elements.rows.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td><span className="tier-tag">{r.tier}</span></td>
                        <td>{r.strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SWOT Layout */}
              {currentSlide.layout === 'swot' && (
                <div className="swot-grid">
                  <div className="swot-box s">
                    <h4>🟢 Strengths</h4>
                    <ul>{(currentSlide.elements.strengths || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="swot-box w">
                    <h4>🟡 Weaknesses</h4>
                    <ul>{(currentSlide.elements.weaknesses || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="swot-box o">
                    <h4>🔵 Opportunities</h4>
                    <ul>{(currentSlide.elements.opportunities || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="swot-box t">
                    <h4>🔴 Threats</h4>
                    <ul>{(currentSlide.elements.threats || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                </div>
              )}

              {/* Roadmap Layout */}
              {currentSlide.layout === 'roadmap' && currentSlide.elements.recommendations && (
                <ol className="roadmap-list">
                  {currentSlide.elements.recommendations.map((r, i) => (
                    <li key={i}>
                      <span className="step-num">Step {i + 1}</span>
                      <p>{r}</p>
                    </li>
                  ))}
                </ol>
              )}

              {/* Cover Title Layout */}
              {currentSlide.layout === 'title' && (
                <div className="cover-meta">
                  <div className="meta-badge">{currentSlide.elements.classification || 'CONFIDENTIAL'}</div>
                  <div className="meta-details">
                    <p><strong>Published:</strong> {currentSlide.elements.date}</p>
                    <p><strong>Platform:</strong> {currentSlide.elements.platform}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="slide-footer">
              <span>JIGYASA AI Executive Briefing</span>
              <span>Slide {currentSlideIndex + 1} of {deck.slides.length}</span>
            </div>
          </div>

          {/* Speaker Notes Drawer */}
          {showNotes && (
            <div className="speaker-notes">
              <h4>💬 Speaker Notes</h4>
              <p>{currentSlide.speaker_notes}</p>
            </div>
          )}

          {/* Navigation Controls overlay */}
          <div className="stage-nav">
            <button className="nav-btn" onClick={handlePrev} disabled={currentSlideIndex === 0}>‹</button>
            <button className="nav-btn" onClick={handleNext} disabled={currentSlideIndex === deck.slides.length - 1}>›</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .deck-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, sans-serif;
          transition: background 0.3s, color 0.3s;
        }

        .deck-page.dark { background: #0a0a12; color: #f0f0f8; }
        .deck-page.light { background: #f8fafc; color: #0f172a; }

        .toolbar {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 17, 32, 0.85);
          backdrop-filter: blur(8px);
        }

        .deck-page.light .toolbar {
          background: rgba(255, 255, 255, 0.9);
          border-bottom-color: rgba(0, 0, 0, 0.08);
        }

        .tb-left { display: flex; align-items: center; gap: 1rem; }
        .tb-back { color: #a78bfa; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
        .tb-title { font-weight: 700; font-size: 0.9rem; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .slide-counter { font-size: 0.85rem; font-weight: 600; color: #9ca3af; }

        .tb-right { display: flex; gap: 0.5rem; }

        .tb-btn {
          padding: 0.4rem 0.875rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tb-btn:hover { background: rgba(255, 255, 255, 0.12); }
        .tb-btn.active { background: rgba(124, 58, 237, 0.2); border-color: #7c3aed; color: #a78bfa; }
        .tb-btn.primary { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; border: none; }
        .tb-btn.primary:hover { opacity: 0.9; }

        .deck-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 52px); }

        .thumbnails-sidebar {
          width: 220px;
          background: rgba(0, 0, 0, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
        }

        .thumb-btn {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          color: #9ca3af;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .thumb-btn:hover { background: rgba(255, 255, 255, 0.07); color: inherit; }
        .thumb-btn.active { background: rgba(124, 58, 237, 0.15); border-color: #7c3aed; color: #a78bfa; font-weight: 600; }

        .thumb-num {
          width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);
          display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;
        }

        .thumb-title { font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

        .slide-stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .slide-frame {
          width: 100%;
          max-width: 960px;
          height: 560px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 32px 100px rgba(0, 0, 0, 0.6);
          box-sizing: border-box;
          position: relative;
        }

        .deck-page.light .slide-frame {
          background: #ffffff;
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        }

        .slide-subtitle {
          padding: 0.25rem 0.75rem;
          background: rgba(124, 58, 237, 0.15);
          color: #a78bfa;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .slide-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .bullets-list { list-style: square; margin: 0; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .bullets-list li { font-size: 1.2rem; color: #d1d5db; line-height: 1.5; }
        .deck-page.light .bullets-list li { color: #334155; }

        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-top: 1rem; }
        .metric-card {
          padding: 1.25rem; background: rgba(255, 255, 255, 0.03); border-radius: 12px;
          border-left: 4px solid #a78bfa;
        }
        .m-val { font-size: 2rem; font-weight: 700; }
        .m-lbl { font-size: 0.82rem; color: #9ca3af; margin-top: 0.25rem; }

        .deck-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .deck-table th, .deck-table td { padding: 0.875rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.07); font-size: 0.95rem; }
        .tier-tag { padding: 0.15rem 0.5rem; background: rgba(124,58,237,0.15); color: #a78bfa; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }

        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }
        .swot-box { padding: 1rem; border-radius: 10px; background: rgba(255,255,255,0.03); border-left: 4px solid #6b7280; }
        .swot-box.s { border-left-color: #10b981; }
        .swot-box.w { border-left-color: #f59e0b; }
        .swot-box.o { border-left-color: #3b82f6; }
        .swot-box.t { border-left-color: #ef4444; }
        .swot-box h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
        .swot-box ul { margin: 0; padding-left: 1.2rem; font-size: 0.82rem; color: #9ca3af; display: flex; flex-direction: column; gap: 0.25rem; }

        .roadmap-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.875rem; }
        .roadmap-list li { display: flex; align-items: flex-start; gap: 1rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; }
        .step-num { padding: 0.2rem 0.6rem; background: #7c3aed; color: #fff; border-radius: 6px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
        .roadmap-list p { margin: 0; font-size: 0.95rem; color: #d1d5db; }

        .meta-badge { display: inline-block; padding: 0.4rem 1rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; border-radius: 8px; font-weight: 700; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .meta-details p { margin: 0.5rem 0; font-size: 1.1rem; color: #9ca3af; }

        .slide-footer { display: flex; justify-content: space-between; font-size: 0.8rem; color: #4b5563; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 1rem; }

        .speaker-notes {
          position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); width: 80%; max-width: 800px;
          background: rgba(17, 17, 32, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px;
          padding: 1rem 1.25rem; box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        }
        .speaker-notes h4 { margin: 0 0 0.4rem; font-size: 0.82rem; color: #a78bfa; }
        .speaker-notes p { margin: 0; font-size: 0.88rem; color: #d1d5db; }

        .stage-nav { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); display: flex; justify-content: space-between; padding: 0 1rem; pointer-events: none; }
        .nav-btn {
          pointer-events: auto; width: 44px; height: 44px; border-radius: 50%; background: rgba(17, 17, 32, 0.8); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) { background: #7c3aed; border-color: #7c3aed; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
