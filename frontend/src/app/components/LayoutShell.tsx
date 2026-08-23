'use client';

import React, { useState, useEffect, ComponentType } from 'react';

interface LayoutShellProps {
  sidebar: React.ReactNode;
  commandPalette: React.ReactNode;
  notificationBell: React.ReactNode;
  searchModal: ComponentType<{ open: boolean; onClose: () => void }>;
  children: React.ReactNode;
}

export default function LayoutShell({
  sidebar,
  commandPalette,
  notificationBell,
  searchModal: SearchModalComponent,
  children,
}: LayoutShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-layout">
      {sidebar}
      {commandPalette}

      {/* Top Header Bar */}
      <div
        id="app-top-header"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: 'var(--sidebar-width, 240px)',
          height: '52px',
          background: 'rgba(10, 10, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 1.5rem',
          gap: '0.625rem',
          zIndex: 100,
        }}
      >
        {/* Search trigger button */}
        <button
          id="global-search-trigger"
          onClick={() => setSearchOpen(true)}
          aria-label="Open global search (Ctrl+K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span>🔍</span>
          <span>Search...</span>
          <kbd style={{
            padding: '0.1rem 0.35rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            color: '#4b5563',
          }}>
            Ctrl K
          </kbd>
        </button>

        {/* Notification Bell */}
        {notificationBell}
      </div>

      <main
        className="app-main"
        style={{ paddingTop: 'calc(52px + 1.5rem)' }}
      >
        {children}
      </main>

      {/* Global Search Modal */}
      <SearchModalComponent open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
