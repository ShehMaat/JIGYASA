'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { intelligenceApi } from '../../../services/api';
import { Project } from '../../../types/intelligence';

interface ProjectDetail extends Project {
  reports: Array<{
    id: string;
    title: string;
    executive_summary: string;
    created_at: string;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const details = await intelligenceApi.getProject(projectId);
        if (details) {
          setProject(details as ProjectDetail);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    if (projectId) load();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="animate-in" style={{ maxWidth: '1000px' }}>
        <div className="skeleton" style={{ height: '30px', width: '200px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '120px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '240px' }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '60px auto' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</p>
        <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>Workspace Not Found</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>This workspace may have been deleted.</p>
        <Link href="/projects"><button className="btn-primary">← Back to Workspaces</button></Link>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Link href="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
          ← Back to Workspaces
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📁 {project.name}</h1>
          <p>{project.description || 'Research Workspace'}</p>
        </div>
        <Link href="/research">
          <button className="btn-primary">🔬 Add Research to Workspace</button>
        </Link>
      </div>

      {/* Workspace Stats */}
      <div className="glass-panel animate-in animate-in-delay-1" style={{ padding: '20px', marginBottom: '28px', display: 'flex', gap: '24px' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Linked Dossiers</p>
          <p style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-accent)' }}>{project.reports?.length || 0}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Created On</p>
          <p style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>{new Date(project.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Linked Dossiers Section */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '16px' }}>
        Linked Intelligence Dossiers
      </h2>

      {(!project.reports || project.reports.length === 0) ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
            No dossiers linked to this workspace yet.
          </p>
          <Link href="/research">
            <button className="btn-primary">🔬 Launch New Research</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {project.reports.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-panel report-card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>{r.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.executive_summary}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
