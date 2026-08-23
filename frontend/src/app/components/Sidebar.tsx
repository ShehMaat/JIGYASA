'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'New Research', href: '/research', icon: '🔬' },
  { label: 'Workspaces', href: '/projects', icon: '📁' },
  { label: 'Compare Matrix', href: '/compare', icon: '📐' },
  { label: 'Knowledge RAG', href: '/knowledge', icon: '🧠' },
  { label: 'Monitoring', href: '/monitoring', icon: '📡' },
  { label: 'Analytics', href: '/analytics', icon: '📈' },
  { label: 'Prompt Studio', href: '/prompts', icon: '🤖' },
  { label: 'Scheduled Research', href: '/scheduled', icon: '⏰' },
  { label: 'Activity Feed', href: '/activity', icon: '📣' },
  { label: 'Report History', href: '/reports', icon: '📋' },
];

const settingsNav: NavItem[] = [
  { label: 'Integrations', href: '/integrations', icon: '🔗' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 101,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-main)',
          padding: '10px 12px',
          fontSize: '1.2rem',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
        }}
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'block' }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">J</div>
          <div className="sidebar-brand-text">
            <h2>JIGYASA</h2>
            <p>Market Intelligence</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: '8px' }}>System</div>
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer Status & Auth Profile */}
        <div className="sidebar-footer">
          {user ? (
            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  👤 {user.full_name || user.email.split('@')[0]}
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{user.role}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '8px' }}>{user.email}</p>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={logout}
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-primary" style={{ width: '100%', fontSize: '0.78rem', padding: '6px' }}>
                  🔑 Sign In / Register
                </button>
              </Link>
            </div>
          )}

          <div className="sidebar-status">
            <div className="sidebar-status-dot" />
            <span className="sidebar-status-text">Groq LLM Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
