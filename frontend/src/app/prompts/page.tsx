'use client';

import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/api';

interface PromptTemplate {
  id: string;
  title: string;
  description?: string;
  system_prompt: string;
  category?: string;
  is_default: boolean;
}

export default function PromptStudioPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [category, setCategory] = useState('Strategy');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const res = await intelligenceApi.listPromptTemplates();
    setTemplates(res || []);
    setLoading(false);
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !systemPrompt) return;

    const res = await intelligenceApi.createPromptTemplate({
      title,
      description,
      system_prompt: systemPrompt,
      category,
    });

    if (res) {
      setTitle('');
      setDescription('');
      setSystemPrompt('');
      loadTemplates();
    }
  }

  async function handleDeleteTemplate(id: string) {
    const ok = await intelligenceApi.deletePromptTemplate(id);
    if (ok) {
      loadTemplates();
    }
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1050px' }}>
      <div className="page-header">
        <div>
          <h1>
            <span className="gradient-text">AI Prompt Template Studio</span>
          </h1>
          <p>Configure custom system prompts & briefing strategies for market intelligence synthesis</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Template Gallery */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
            📚 System Briefing Templates ({templates.length})
          </h2>

          {loading ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              Loading templates...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {templates.map((tpl) => (
                <div key={tpl.id} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{tpl.title}</h3>
                      {tpl.is_default && <span className="badge badge-primary">Default</span>}
                      <span className="badge badge-secondary">{tpl.category || 'General'}</span>
                    </div>

                    {!tpl.is_default && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#f87171' }}
                        onClick={() => handleDeleteTemplate(tpl.id)}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>

                  {tpl.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {tpl.description}
                    </p>
                  )}

                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {tpl.system_prompt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Template Creator */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>➕ Create Custom Prompt</h3>
            <form onSubmit={handleCreateTemplate} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Template Title
                </label>
                <input
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SaaS ARR & Growth Multiples"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Strategy">Strategy</option>
                  <option value="Financial">Financial & M&A</option>
                  <option value="Product">Product & Tech</option>
                  <option value="Venture Capital">Venture Capital</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of strategic focus"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Custom System Prompt Instructions
                </label>
                <textarea
                  className="input-field"
                  rows={5}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Focus heavily on ARR growth rates, gross margins, CAC payback periods, and valuation multiples."
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary">
                ✨ Save Prompt Template
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
