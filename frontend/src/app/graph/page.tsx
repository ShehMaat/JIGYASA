'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../services/api';

interface Node {
  id: string;
  label: string;
  type: string;
  color: string;
  val: number;
  meta: Record<string, unknown>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isDragging?: boolean;
}

interface LinkItem {
  source: string;
  target: string;
  relationship: string;
  label: string;
}

interface GraphData {
  nodes: Node[];
  links: LinkItem[];
  stats: Record<string, number>;
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  company:  { icon: '🏢', label: 'Company',   color: '#a78bfa' },
  industry: { icon: '🏭', label: 'Industry',  color: '#38bdf8' },
  report:   { icon: '📋', label: 'Dossier',   color: '#34d399' },
  project:  { icon: '📁', label: 'Project',   color: '#f43f5e' },
  schedule: { icon: '⏰', label: 'Schedule',  color: '#fbbf24' },
};

export default function IntelligenceGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation state stored in refs for animation loop
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<LinkItem[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<Node | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    intelligenceApi.getGraphData().then(res => {
      if (!mounted) return;
      if (res && res.nodes) {
        const initializedNodes: Node[] = res.nodes.map((n: Node, idx: number) => {
          const angle = (idx / res.nodes.length) * Math.PI * 2;
          const radius = 150 + Math.random() * 180;
          return {
            ...n,
            x: 500 + Math.cos(angle) * radius,
            y: 350 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
          };
        });
        nodesRef.current = initializedNodes;
        linksRef.current = res.links || [];
        setData(res);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // ── Physics & Render Loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, width, height);

      // Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40 * cameraRef.current.zoom;
      const offsetX = (cameraRef.current.x % gridSize);
      const offsetY = (cameraRef.current.y % gridSize);
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.save();
      ctx.translate(cameraRef.current.x + width / 2, cameraRef.current.y + height / 2);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Simple Force Simulation Step
      const kRepulsion = 1200;
      const kSpring = 0.03;
      const springLength = 120;

      // 1. Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = kRepulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!n1.isDragging) { n1.vx = (n1.vx || 0) - fx; n1.vy = (n1.vy || 0) - fy; }
          if (!n2.isDragging) { n2.vx = (n2.vx || 0) + fx; n2.vy = (n2.vy || 0) + fy; }
        }
      }

      // 2. Spring force along links
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      for (const link of links) {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (!sourceNode || !targetNode) continue;

        const dx = (targetNode.x || 0) - (sourceNode.x || 0);
        const dy = (targetNode.y || 0) - (sourceNode.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const delta = dist - springLength;
        const fx = (dx / dist) * delta * kSpring;
        const fy = (dy / dist) * delta * kSpring;

        if (!sourceNode.isDragging) { sourceNode.vx = (sourceNode.vx || 0) + fx; sourceNode.vy = (sourceNode.vy || 0) + fy; }
        if (!targetNode.isDragging) { targetNode.vx = (targetNode.vx || 0) - fx; targetNode.vy = (targetNode.vy || 0) - fy; }
      }

      // 3. Center gravity force
      for (const n of nodes) {
        if (!n.isDragging) {
          n.vx = ((n.vx || 0) - (n.x || 0) * 0.005) * 0.88;
          n.vy = ((n.vy || 0) - (n.y || 0) * 0.005) * 0.88;
          n.x = (n.x || 0) + n.vx;
          n.y = (n.y || 0) + n.vy;
        }
      }

      // Filter active node IDs
      const filteredType = filterType;
      const isFiltered = (n: Node) => filteredType === 'all' || n.type === filteredType;
      const isSearchMatch = (n: Node) => !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase());

      // Draw Links
      for (const link of links) {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (!s || !t) continue;
        if (!isFiltered(s) && !isFiltered(t)) continue;

        const isHighlighted = (hoveredNode && (s.id === hoveredNode.id || t.id === hoveredNode.id)) ||
                             (selectedNode && (s.id === selectedNode.id || t.id === selectedNode.id));

        ctx.beginPath();
        ctx.moveTo(s.x || 0, s.y || 0);
        ctx.lineTo(t.x || 0, t.y || 0);
        ctx.strokeStyle = isHighlighted ? '#a78bfa' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();

        // Edge relationship label on highlight
        if (isHighlighted) {
          const midX = ((s.x || 0) + (t.x || 0)) / 2;
          const midY = ((s.y || 0) + (t.y || 0)) / 2;
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#a78bfa';
          ctx.fillText(link.label, midX, midY);
        }
      }

      // Draw Nodes
      for (const n of nodes) {
        const passesFilter = isFiltered(n);
        const matchesSearch = isSearchMatch(n);

        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const radius = n.val || 14;

        ctx.globalAlpha = passesFilter && matchesSearch ? 1 : 0.2;

        // Outer glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x || 0, n.y || 0, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `${n.color}44`;
          ctx.fill();
        }

        // Search highlight ring
        if (searchTerm && matchesSearch) {
          ctx.beginPath();
          ctx.arc(n.x || 0, n.y || 0, radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(n.x || 0, n.y || 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Node Icon
        const icon = TYPE_META[n.type]?.icon || '•';
        ctx.font = `${Math.floor(radius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(icon, n.x || 0, (n.y || 0) + 1);

        // Label
        ctx.font = isSelected || isHovered ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isSelected ? '#ffffff' : '#d1d5db';
        ctx.fillText(n.label, n.x || 0, (n.y || 0) + radius + 5);

        ctx.globalAlpha = 1;
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [filterType, searchTerm, selectedNode, hoveredNode]);

  // ── Resize Canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Canvas Interaction Handlers ──────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // Map to graph space
    const worldX = (rawX - canvas.width / 2 - cameraRef.current.x) / cameraRef.current.zoom;
    const worldY = (rawY - canvas.height / 2 - cameraRef.current.y) / cameraRef.current.zoom;
    return { worldX, worldY, rawX, rawY };
  };

  const findNodeAt = (wx: number, wy: number) => {
    for (const n of nodesRef.current) {
      const dx = (n.x || 0) - wx;
      const dy = (n.y || 0) - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= (n.val || 14) + 6) return n;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, rawX, rawY } = getCanvasPos(e);
    const hit = findNodeAt(worldX, worldY);

    if (hit) {
      hit.isDragging = true;
      draggedNodeRef.current = hit;
      setSelectedNode(hit);
    } else {
      isMouseDownRef.current = true;
      dragStartRef.current = { x: rawX - cameraRef.current.x, y: rawY - cameraRef.current.y };
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, rawX, rawY } = getCanvasPos(e);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = worldX;
      draggedNodeRef.current.y = worldY;
      return;
    }

    if (isMouseDownRef.current) {
      cameraRef.current.x = rawX - dragStartRef.current.x;
      cameraRef.current.y = rawY - dragStartRef.current.y;
      return;
    }

    const hit = findNodeAt(worldX, worldY);
    setHoveredNode(hit);
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isDragging = false;
      draggedNodeRef.current = null;
    }
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    cameraRef.current.zoom = Math.min(3, Math.max(0.3, cameraRef.current.zoom * factor));
  };

  // Connected links for selected node
  const connectedLinks = selectedNode
    ? (data?.links || []).filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];

  return (
    <div className="graph-page">
      {/* Header Bar */}
      <div className="graph-header">
        <div className="header-left">
          <span className="page-icon">🌐</span>
          <div>
            <h1>Intelligence Graph</h1>
            <p className="subtitle">Visual entity relationship topology across dossiers, companies & schedules</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-chips">
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'company', label: '🏢 Companies' },
            { id: 'industry', label: '🏭 Industries' },
            { id: 'report', label: '📋 Dossiers' },
            { id: 'project', label: '📁 Projects' },
            { id: 'schedule', label: '⏰ Schedules' },
          ].map(f => (
            <button
              key={f.id}
              className={`chip ${filterType === f.id ? 'active' : ''}`}
              onClick={() => setFilterType(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="search-box">
          <span>🔍</span>
          <input
            placeholder="Search node..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
        </div>
      </div>

      {/* Stats Bar */}
      {data?.stats && (
        <div className="stats-strip">
          <span className="stat">📊 {data.stats.total_nodes || 0} Nodes</span>
          <span className="stat">🔗 {data.stats.total_links || 0} Connections</span>
          <span className="stat">🏢 {data.stats.company || 0} Companies</span>
          <span className="stat">🏭 {data.stats.industry || 0} Industries</span>
          <span className="stat">📋 {data.stats.report || 0} Dossiers</span>
          <span className="stat">⏰ {data.stats.schedule || 0} Schedules</span>
        </div>
      )}

      {/* Canvas Container */}
      <div className="canvas-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Constructing Intelligence Graph topology...</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />
        )}

        {/* Canvas Controls Legend */}
        <div className="canvas-controls-hint">
          <span>💡 Drag canvas to pan · Scroll to zoom · Drag node to reposition · Click to inspect</span>
        </div>

        {/* Node Inspection Drawer */}
        {selectedNode && (
          <div className="node-drawer">
            <div className="drawer-header">
              <div className="drawer-title-group">
                <span className="type-badge" style={{ background: `${selectedNode.color}22`, color: selectedNode.color }}>
                  {TYPE_META[selectedNode.type]?.icon || '•'} {TYPE_META[selectedNode.type]?.label || selectedNode.type}
                </span>
                <h2>{selectedNode.label}</h2>
              </div>
              <button className="drawer-close" onClick={() => setSelectedNode(null)}>×</button>
            </div>

            <div className="drawer-section">
              <h3>Connections ({connectedLinks.length})</h3>
              {connectedLinks.length === 0 ? (
                <p className="no-conn">No direct connections mapped yet</p>
              ) : (
                <div className="conn-list">
                  {connectedLinks.map((link, i) => {
                    const isSource = link.source === selectedNode.id;
                    const otherId = isSource ? link.target : link.source;
                    const otherNode = data?.nodes.find(n => n.id === otherId);
                    return (
                      <div key={i} className="conn-item" onClick={() => otherNode && setSelectedNode(otherNode)}>
                        <span className="rel-tag">{link.label}</span>
                        <span className="other-name">{otherNode?.label || otherId}</span>
                        <span className="other-type" style={{ color: otherNode?.color }}>
                          {TYPE_META[otherNode?.type || '']?.icon || '•'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Deep link if meta url exists */}
            {selectedNode.meta?.url && (
              <div className="drawer-actions">
                <Link href={selectedNode.meta.url as string} className="btn-open-entity">
                  Open {TYPE_META[selectedNode.type]?.label || 'Entity'} →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .graph-page {
          height: calc(100vh - 52px);
          display: flex;
          flex-direction: column;
          background: #0a0a12;
          color: #f0f0f8;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        .graph-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(17, 17, 32, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .page-icon { font-size: 2rem; }

        h1 {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #a78bfa, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle { font-size: 0.8rem; color: #6b7280; margin: 0.15rem 0 0; }

        .filter-chips {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
        }

        .chip {
          padding: 0.35rem 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          color: #9ca3af;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.18s;
        }

        .chip:hover { border-color: rgba(167, 139, 250, 0.4); color: #e5e7eb; }
        .chip.active { background: rgba(167, 139, 250, 0.15); border-color: #a78bfa; color: #a78bfa; font-weight: 600; }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.82rem;
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: #f0f0f8;
          font-size: 0.82rem;
          width: 140px;
        }

        .search-box button {
          background: none; border: none; color: #6b7280; cursor: pointer; font-size: 0.9rem; padding: 0;
        }

        .stats-strip {
          display: flex;
          gap: 1.5rem;
          padding: 0.4rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.75rem;
          color: #6b7280;
        }

        .stat { display: flex; align-items: center; gap: 0.3rem; }

        .canvas-container {
          flex: 1;
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        canvas {
          width: 100%;
          height: 100%;
          display: block;
          cursor: grab;
        }

        canvas:active { cursor: grabbing; }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1rem;
          color: #6b7280;
        }

        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(167, 139, 250, 0.2);
          border-top-color: #a78bfa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .canvas-controls-hint {
          position: absolute;
          bottom: 1rem;
          left: 1.5rem;
          background: rgba(17, 17, 32, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.4rem 0.875rem;
          font-size: 0.72rem;
          color: #6b7280;
          pointer-events: none;
        }

        /* Node Drawer */
        .node-drawer {
          position: absolute;
          top: 1rem;
          right: 1.5rem;
          width: 320px;
          background: rgba(17, 17, 32, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
          animation: slideInRight 0.18s ease;
          z-index: 10;
        }

        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        .drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .type-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.35rem;
        }

        .drawer-header h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: #f0f0f8;
        }

        .drawer-close {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1.4rem;
          cursor: pointer;
          line-height: 1;
          padding: 0;
        }

        .drawer-section h3 {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
          margin: 0 0 0.5rem;
        }

        .no-conn { font-size: 0.8rem; color: #4b5563; }

        .conn-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          max-height: 220px;
          overflow-y: auto;
        }

        .conn-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.625rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .conn-item:hover { background: rgba(167, 139, 250, 0.1); }

        .rel-tag {
          font-size: 0.68rem;
          color: #6b7280;
          background: rgba(255,255,255,0.06);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .other-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #d1d5db;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .other-type { font-size: 0.9rem; }

        .drawer-actions {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .btn-open-entity {
          display: block;
          text-align: center;
          padding: 0.6rem;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border-radius: 8px;
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .btn-open-entity:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
