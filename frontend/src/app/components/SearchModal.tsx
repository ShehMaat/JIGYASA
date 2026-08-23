'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { intelligenceApi } from '../../services/api';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  url: string;
  score: number;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  report:    { icon: '📋', label: 'Dossier',    color: '#7c3aed' },
  project:   { icon: '📁', label: 'Project',    color: '#0891b2' },
  knowledge: { icon: '🧠', label: 'Knowledge',  color: '#059669' },
  monitor:   { icon: '📡', label: 'Monitor',    color: '#d97706' },
  schedule:  { icon: '⏰', label: 'Schedule',   color: '#6366f1' },
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.url);
    onClose();
  }, [router, onClose]);

  // Focus input & reset on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setResults([]);
        setActiveIndex(0);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data: SearchResponse = await intelligenceApi.globalSearch(q);
    setResults(data.results || []);
    setActiveIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      const timer = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timer);
    }
    debounceRef.current = setTimeout(() => doSearch(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { setActiveIndex(i => Math.min(i + 1, Math.max(0, results.length - 1))); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setActiveIndex(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === 'Enter' && results[activeIndex]) {
        navigate(results[activeIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, activeIndex, onClose, navigate]);


  // Group results by type
  const grouped: Record<string, SearchResult[]> = {};
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  // Flat ordered list for keyboard nav index
  const flat = Object.values(grouped).flat();

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="search-input-row">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            id="global-search-input"
            className="search-input"
            placeholder="Search reports, projects, knowledge, monitors..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {loading && <div className="search-spinner" />}
          <kbd className="esc-hint">ESC</kbd>
        </div>

        {/* Results */}
        <div className="search-results">
          {!query.trim() && (
            <div className="search-hint">
              <p>Start typing to search across your entire JIGYASA workspace</p>
              <div className="hint-chips">
                {['OpenAI', 'Anthropic', 'SaaS', 'weekly'].map(hint => (
                  <button key={hint} className="hint-chip" onClick={() => setQuery(hint)}>
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="no-results">
              <span>🔍</span>
              <p>No results for <strong>&ldquo;{query}&rdquo;</strong></p>
              <span className="no-results-sub">Try a company name, industry, or keyword</span>
            </div>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const meta = TYPE_META[type] || { icon: '•', label: type, color: '#6b7280' };
            return (
              <div key={type} className="result-group">
                <div className="group-label" style={{ color: meta.color }}>
                  {meta.icon} {meta.label}s
                </div>
                {items.map(result => {
                  const idx = flat.indexOf(result);
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={result.id}
                      className={`result-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="result-type-dot" style={{ background: meta.color }} />
                      <div className="result-text">
                        <span className="result-title">{result.title}</span>
                        <span className="result-subtitle">{result.subtitle}</span>
                      </div>
                      <span className="result-score">
                        {Math.round(result.score * 100)}%
                      </span>
                      {isActive && <kbd className="result-enter">↵</kbd>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {results.length > 0 && (
          <div className="search-footer">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>ESC</kbd> close</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
        }

        .search-modal {
          width: 100%;
          max-width: 640px;
          background: #111120;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 32px 100px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 58, 237, 0.15);
          overflow: hidden;
          animation: slideDown 0.18s ease;
        }

        @keyframes slideDown {
          from { transform: translateY(-16px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .search-input-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .search-icon { font-size: 1.1rem; flex-shrink: 0; }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #f0f0f8;
          font-size: 1rem;
          font-family: inherit;
        }

        .search-input::placeholder { color: #4b5563; }

        .search-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(124, 58, 237, 0.3);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .esc-hint {
          padding: 0.2rem 0.5rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 5px;
          font-size: 0.7rem;
          color: #6b7280;
          font-family: monospace;
          flex-shrink: 0;
        }

        .search-results {
          max-height: 55vh;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .search-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          gap: 1rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .hint-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .hint-chip {
          padding: 0.3rem 0.875rem;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-radius: 9999px;
          color: #a78bfa;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .hint-chip:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.5rem;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .no-results span:first-child { font-size: 2rem; }
        .no-results p { margin: 0; color: #9ca3af; }
        .no-results strong { color: #e5e7eb; }
        .no-results-sub { font-size: 0.8rem; }

        .result-group { padding: 0.25rem 0; }

        .group-label {
          padding: 0.5rem 1.25rem 0.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 1.25rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
        }

        .result-item:hover, .result-item.active {
          background: rgba(124, 58, 237, 0.1);
        }

        .result-type-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .result-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .result-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f0f0f8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-score {
          font-size: 0.7rem;
          color: #4b5563;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        .result-enter {
          padding: 0.1rem 0.4rem;
          background: rgba(124, 58, 237, 0.2);
          border: 1px solid rgba(124, 58, 237, 0.4);
          border-radius: 4px;
          font-size: 0.65rem;
          color: #a78bfa;
          flex-shrink: 0;
        }

        .search-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.72rem;
          color: #4b5563;
        }

        .search-footer kbd {
          padding: 0.1rem 0.35rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.65rem;
          color: #6b7280;
          margin: 0 0.1rem;
        }
      `}</style>
    </div>
  );
}
