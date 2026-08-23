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

  // File Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const res = await intelligenceApi.uploadKnowledgeDocument(fileToUpload);
      if (res && res.chunks_indexed) {
        setUploadStatus(`✅ Successfully indexed ${res.chunks_indexed} vector chunk(s) from "${res.filename}".`);
      } else {
        setUploadStatus('❌ Upload failed. Please check the file format (.pdf, .txt, .md).');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('❌ An error occurred during file processing.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            Knowledge Base <span className="gradient-text">Vector RAG</span>
          </h1>
          <p>Semantic similarity query engine over indexed market dossiers & corporate documents</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)} id="upload-doc-btn">
          📤 Upload Document
        </button>
      </div>

      {/* Drag & Drop Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>📤 Ingest Document into RAG Vector Store</h3>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadStatus(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary-accent)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '36px 20px',
                textAlign: 'center',
                background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📄</p>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '6px' }}>
                Drag & Drop PDF, TXT, or MD file here
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '16px' }}>
                Supported formats: .pdf, .txt, .md (Auto-chunks into ~500 word vectors)
              </p>

              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Browse File
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      handleFileUpload(file);
                    }
                  }}
                />
              </label>
            </div>

            {isUploading && (
              <div style={{ textAlign: 'center', color: 'var(--primary-accent)', fontSize: '0.88rem', padding: '10px' }}>
                ⚙️ Extracting text & indexing vector embeddings...
              </div>
            )}

            {uploadStatus && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  background: uploadStatus.includes('Successfully') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: uploadStatus.includes('Successfully') ? '#34d399' : '#f87171',
                  border: `1px solid ${uploadStatus.includes('Successfully') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '16px',
                }}
              >
                {uploadStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadStatus(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query Search Bar */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          style={{ display: 'flex', gap: '12px' }}
        >
          <input
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything across indexed market dossiers & ingested PDFs..."
            style={{ fontSize: '1rem' }}
            id="rag-query-input"
          />
          <button className="btn-primary" type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? 'Synthesizing...' : '🧠 Query RAG'}
          </button>
        </form>

        {/* Prompt Suggestions */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '8px' }}>Suggested Queries:</p>
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

      {/* Results View */}
      {isSearching ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '24px', width: '60%', margin: '0 auto 16px' }} />
          <div className="skeleton" style={{ height: '120px', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Scanning vector index & synthesizing RAG evidence response...
          </p>
        </div>
      ) : result ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Synthesized Answer Box */}
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--primary-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>🤖 Synthesized AI Insight</h2>
              <span className="badge badge-primary">
                Confidence: {Math.round(result.confidence_score * 100)}%
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
              {result.synthesized_answer}
            </p>
          </div>

          {/* Sourced Citations / Chunks */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>
              📚 Verified Source Passages ({result.relevant_chunks.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {result.relevant_chunks.map((chunk, idx) => (
                <div key={chunk.id || idx} className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--secondary-accent)' }}>
                      [{idx + 1}] {chunk.title}
                    </h4>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      Match: {Math.round((chunk.relevance_score || 0.8) * 100)}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    &ldquo;{chunk.content_snippet}&rdquo;
                  </p>
                  {chunk.source_url && (
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <a href={chunk.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary-accent)' }}>
                        🔗 View Source File / Link
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
