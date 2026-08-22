'use client';

import React, { useState } from 'react';
import { intelligenceApi } from '../../services/api';

interface RAGChunk {
  id: string;
  title: string;
  source_url?: string;
  content_snippet: string;
  relevance_score: number;
}

interface RAGResult {
  query: string;
  synthesized_answer: string;
  relevant_chunks: RAGChunk[];
  confidence_score: number;
}

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);

  // Quick prompt suggestions
  const SUGGESTIONS = [
    'What are the primary pricing models across tracked SaaS competitors?',
    'What key market trends are driving enterprise cloud data adoption?',
    'How do target companies differentiate on security and compliance?',
    'What are the major threats identified across market dossiers?',
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsSearching(true);

    try {
      const res = await intelligenceApi.queryKnowledge(searchQuery);
      setResult(res);
    } catch (err) {
      console.error('Failed to query knowledge base:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: '960px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Knowledge <span className="gradient-text">Base RAG</span>
          </h1>
          <p>Semantic vector search across indexed market dossiers & crawled web signals</p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel animate-in animate-in-delay-1" style={{ padding: '24px', marginBottom: '24px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Ask any strategic question about tracked markets or competitors..."
              style={{ fontSize: '1rem', padding: '14px 18px' }}
              id="rag-query-input"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isSearching || !query.trim()}
              style={{ padding: '14px 28px', whiteSpace: 'nowrap' }}
              id="search-rag-btn"
            >
              {isSearching ? '⚡ Searching...' : '🔍 Ask RAG'}
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '8px' }}>
            Suggested Queries:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => handleSearch(s)}
              >
                💡 {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RAG Answer Display */}
      {isSearching && (
        <div className="glass-panel animate-in" style={{ padding: '32px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '24px', width: '60%', margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ height: '80px', width: '90%', margin: '0 auto' }} />
        </div>
      )}

      {result && !isSearching && (
        <div className="animate-in animate-in-delay-2" style={{ display: 'grid', gap: '20px' }}>
          {/* Synthesized Answer Panel */}
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderLeft: '4px solid var(--primary-accent)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                🧠 Evidence-Backed Strategic Answer
              </h3>
              <span className="badge badge-success">
                {Math.round((result.confidence_score || 0.85) * 100)}% Match Confidence
              </span>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {result.synthesized_answer}
            </p>
          </div>

          {/* Sourced Citations & Evidence Chunks */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '14px', color: 'var(--text-muted)' }}>
              🔗 Relevant Evidence Chunks ({result.relevant_chunks?.length || 0})
            </h3>

            {(!result.relevant_chunks || result.relevant_chunks.length === 0) ? (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                No direct vector matches found. Run a new research to index additional signals.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {result.relevant_chunks.map((chunk) => (
                  <div key={chunk.id} className="glass-panel" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{chunk.title}</h4>
                      <span className="badge badge-primary">
                        Score: {chunk.relevance_score}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '8px' }}>
                      &ldquo;{chunk.content_snippet}&rdquo;
                    </p>

                    {chunk.source_url && (
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--secondary-accent)', wordBreak: 'break-all' }}
                      >
                        🔗 {chunk.source_url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
