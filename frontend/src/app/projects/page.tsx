'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../services/api';
import { Project } from '../../types/intelligence';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await intelligenceApi.listProjects();
        setProjects(list);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await intelligenceApi.createProject(projectName, projectDesc);
      if (created) {
        setProjects((prev) => [created, ...prev]);
        setProjectName('');
        setProjectDesc('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;
    const ok = await intelligenceApi.deleteProject(id);
    if (ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Research <span className="gradient-text">Workspaces</span>
          </h1>
          <p>Organize market dossiers and competitive analysis by project</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
          id="new-workspace-btn"
        >
          📁 New Workspace
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel animate-in"
            style={{ width: '100%', maxWidth: '480px', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>📁 Create Research Workspace</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Workspace Name *
                </label>
                <input
                  className="input-field"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q3 Fintech Expansion, AI Market Landscape"
                  required
                  id="workspace-name-input"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Brief goal or focus area for this workspace..."
                  rows={3}
                  id="workspace-desc-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || !projectName.trim()}>
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</p>
          <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>
            No Workspaces Created
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Create workspaces to group related market dossiers by initiative or sector.
          </p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            📁 Create First Workspace
          </button>
        </div>
      ) : (
        <div
          className="animate-in animate-in-delay-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {projects.map((project) => (
            <div key={project.id} className="glass-panel report-card">
              <Link
                href={`/projects/${project.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600' }}>📁 {project.name}</h3>
                  <span className="badge badge-primary">
                    {project.report_count || 0} Reports
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    minHeight: '38px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>
              </Link>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
