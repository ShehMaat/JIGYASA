'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { intelligenceApi } from '../../services/api';
import { MarketReport, Project } from '../../types/intelligence';

interface CommandItem {
  id: string;
  type: 'navigation' | 'report' | 'project';
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

const STATIC_ROUTES: CommandItem[] = [
  { id: 'nav-home', type: 'navigation', title: 'Dashboard', subtitle: 'Main overview & KPI cards', icon: '📊', url: '/' },
  { id: 'nav-research', type: 'navigation', title: 'New Market Research', subtitle: 'Launch AI research task', icon: '🔬', url: '/research' },
  { id: 'nav-projects', type: 'navigation', title: 'Research Workspaces', subtitle: 'Manage project folders', icon: '📁', url: '/projects' },
  { id: 'nav-compare', type: 'navigation', title: 'Battlecard Comparison Matrix', subtitle: 'Compare dossiers side-by-side', icon: '📐', url: '/compare' },
  { id: 'nav-knowledge', type: 'navigation', title: 'Knowledge Base RAG', subtitle: 'Vector semantic query engine', icon: '🧠', url: '/knowledge' },
  { id: 'nav-monitoring', type: 'navigation', title: 'Competitor Monitoring', subtitle: 'Shift alerts & automated tracking', icon: '📡', url: '/monitoring' },
  { id: 'nav-reports', type: 'navigation', title: 'Report History', subtitle: 'Archive of generated dossiers', icon: '📋', url: '/reports' },
  { id: 'nav-settings', type: 'navigation', title: 'Settings', subtitle: 'AI Engine & API settings', icon: '⚙️', url: '/settings' },
];

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch dynamic reports & projects when palette opens
  useEffect(() => {
    if (isOpen) {
      async function fetchData() {
        try {
          const [rList, pList] = await Promise.all([
            intelligenceApi.listReports(),
            intelligenceApi.listProjects(),
          ]);
          setReports(rList);
          setProjects(pList);
        } catch {
          // fallback
        }
      }
      fetchData();
    }
  }, [isOpen]);

  // Combine dynamic items
  const dynamicItems: CommandItem[] = [
    ...STATIC_ROUTES,
    ...projects.map((p) => ({
      id: `proj-${p.id}`,
      type: 'project' as const,
      title: `Workspace: ${p.name}`,
      subtitle: p.description || 'Project Workspace',
      icon: '📁',
      url: `/projects/${p.id}`,
    })),
    ...reports.map((r) => ({
      id: `rep-${r.id}`,
      type: 'report' as const,
      title: r.title,
      subtitle: r.executive_summary?.slice(0, 80) + '...',
      icon: '📄',
      url: `/reports/${r.id}`,
    })),
  ];

  const filteredItems = query.trim()
    ? dynamicItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : dynamicItems;

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="glass-panel animate-in"
        style={{
          width: '100%',
          maxWidth: '600px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--primary-accent)' }}>🔍</span>
          <input
            autoFocus
            className="input-field"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search reports, workspaces, RAG..."
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0',
              fontSize: '1.05rem',
              boxShadow: 'none',
            }}
            id="command-palette-input"
          />
          <kbd
            style={{
              fontSize: '0.72rem',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 8px',
              borderRadius: '4px',
              color: 'var(--text-subtle)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px 10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching commands or reports found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.url)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: selectedIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: selectedIndex === idx ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.subtitle}
                  </p>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  {item.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
