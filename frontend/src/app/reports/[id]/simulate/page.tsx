'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { intelligenceApi } from '../../../../services/api';

interface SimulationResult {
  report_id: string;
  baseline: Record<string, string>;
  simulated: {
    TAM: string;
    SAM: string;
    SOM: string;
    CAGR: string;
    som_delta_pct: number;
  };
  sensitivity_index: number;
  resilience_score: string;
  recalibrated_recommendations: string[];
  impact_summary: str;
}

export default function ScenarioSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [priceAdj, setPriceAdj] = useState<number>(0);
  const [growthDelta, setGrowthDelta] = useState<number>(0);
  const [aggression, setAggression] = useState<string>('moderate');
  const [rdBoost, setRdBoost] = useState<number>(0);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSim = useCallback(async (
    p: number, g: number, a: string, rd: number
  ) => {
    const res = await intelligenceApi.runScenarioSimulation(reportId, {
      price_adjustment_pct: p,
      market_growth_delta_pct: g,
      competitor_aggression: a,
      r_and_d_investment_boost: rd,
    });
    if (res) setSimResult(res);
    setLoading(false);
  }, [reportId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSim(priceAdj, growthDelta, aggression, rdBoost);
    }, 200);
    return () => clearTimeout(timer);
  }, [priceAdj, growthDelta, aggression, rdBoost, runSim]);

  const handleReset = () => {
    setPriceAdj(0);
    setGrowthDelta(0);
    setAggression('moderate');
    setRdBoost(0);
  };

  const getScoreColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10b981';
    if (grade === 'B') return '#3b82f6';
    if (grade === 'C') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="simulator-page">
      {/* Header Bar */}
      <div className="sim-header">
        <div className="header-left">
          <Link href={`/reports/${reportId}`} className="btn-back">← Back to Dossier</Link>
          <h1>⚡ Strategic Scenario Simulator</h1>
          <p className="subtitle">Real-time &quot;What-If&quot; market stress testing & sensitivity matrix engine</p>
        </div>

        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset Parameters
        </button>
      </div>

      <div className="sim-grid">
        {/* Controls Column */}
        <div className="controls-panel">
          <h3>🎛️ Market Shock Controls</h3>

          {/* Price Adjustment Slider */}
          <div className="control-group">
            <div className="control-label">
              <span>🏷️ Price Adjustment</span>
              <span className="val-badge" style={{ color: priceAdj < 0 ? '#ef4444' : priceAdj > 0 ? '#10b981' : '#9ca3af' }}>
                {priceAdj > 0 ? `+${priceAdj}%` : `${priceAdj}%`}
              </span>
            </div>
            <input
              type="range" min="-50" max="50" step="5"
              value={priceAdj}
              onChange={e => setPriceAdj(parseFloat(e.target.value))}
            />
            <div className="range-hints"><span>-50% Price Cut</span><span>Baseline</span><span>+50% Premium</span></div>
          </div>

          {/* Market Growth Slider */}
          <div className="control-group">
            <div className="control-label">
              <span>📈 Market Growth Delta</span>
              <span className="val-badge" style={{ color: growthDelta < 0 ? '#ef4444' : growthDelta > 0 ? '#10b981' : '#9ca3af' }}>
                {growthDelta > 0 ? `+${growthDelta}%` : `${growthDelta}%`}
              </span>
            </div>
            <input
              type="range" min="-20" max="30" step="2"
              value={growthDelta}
              onChange={e => setGrowthDelta(parseFloat(e.target.value))}
            />
            <div className="range-hints"><span>Recession (-20%)</span><span>Baseline</span><span>Boom (+30%)</span></div>
          </div>

          {/* Competitor Aggression Toggle */}
          <div className="control-group">
            <div className="control-label">
              <span>⚔️ Competitor Aggression</span>
            </div>
            <div className="chip-group">
              {[
                { id: 'low', label: '🟢 Low' },
                { id: 'moderate', label: '🟡 Moderate' },
                { id: 'aggressive', label: '🟠 Aggressive' },
                { id: 'hostile', label: '🔴 Hostile Price War' },
              ].map(chip => (
                <button
                  key={chip.id}
                  className={`chip-btn ${aggression === chip.id ? 'active' : ''}`}
                  onClick={() => setAggression(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* R&D Boost Slider */}
          <div className="control-group">
            <div className="control-label">
              <span>🔬 R&D Investment Boost</span>
              <span className="val-badge" style={{ color: '#a78bfa' }}>
                +{rdBoost}%
              </span>
            </div>
            <input
              type="range" min="0" max="100" step="10"
              value={rdBoost}
              onChange={e => setRdBoost(parseFloat(e.target.value))}
            />
            <div className="range-hints"><span>Status Quo</span><span>+50% Budget</span><span>2x R&D (+100%)</span></div>
          </div>
        </div>

        {/* Results Display Column */}
        <div className="results-panel">
          {loading ? (
            <div className="sim-loading">
              <div className="spinner" />
              <p>Recalculating strategic metrics...</p>
            </div>
          ) : simResult ? (
            <>
              {/* Impact Banner */}
              <div className="impact-banner">
                <div className="banner-left">
                  <span className="banner-icon">⚡</span>
                  <div>
                    <div className="banner-title">Scenario Impact Summary</div>
                    <div className="banner-desc">{simResult.impact_summary}</div>
                  </div>
                </div>

                <div className="gauge-box" style={{ borderColor: getScoreColor(simResult.resilience_score) }}>
                  <div className="grade" style={{ color: getScoreColor(simResult.resilience_score) }}>
                    {simResult.resilience_score}
                  </div>
                  <div className="grade-lbl">Resilience Score</div>
                </div>
              </div>

              {/* Baseline vs Simulated Metrics Grid */}
              <div className="metrics-comparison">
                {[
                  { label: 'Total Addressable Market (TAM)', base: simResult.baseline.TAM, sim: simResult.simulated.TAM, color: '#a78bfa' },
                  { label: 'Serviceable Addressable (SAM)', base: simResult.baseline.SAM, sim: simResult.simulated.SAM, color: '#38bdf8' },
                  { label: 'Serviceable Obtainable (SOM)', base: simResult.baseline.SOM, sim: simResult.simulated.SOM, color: '#34d399', highlight: true },
                  { label: 'CAGR Growth Rate', base: simResult.baseline.CAGR, sim: simResult.simulated.CAGR, color: '#fbbf24' },
                ].map(m => (
                  <div key={m.label} className={`metric-box ${m.highlight ? 'highlight' : ''}`}>
                    <div className="m-label">{m.label}</div>
                    <div className="m-values">
                      <div className="base-val">
                        <span className="val-lbl">Baseline:</span> {m.base}
                      </div>
                      <div className="sim-val" style={{ color: m.color }}>
                        <span className="val-lbl">Simulated:</span> {m.sim}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recalibrated Recommendations */}
              <div className="recalibrated-box">
                <h3>💡 Recalibrated Strategic Actions</h3>
                <ul className="recal-list">
                  {simResult.recalibrated_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .simulator-page {
          min-height: calc(100vh - 52px);
          background: #0a0a12;
          color: #f0f0f8;
          padding: 2rem;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .sim-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .btn-back { color: #a78bfa; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.35rem; }

        h1 {
          font-size: 1.6rem; font-weight: 700; margin: 0;
          background: linear-gradient(135deg, #a78bfa, #38bdf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .subtitle { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.85rem; }

        .btn-reset {
          padding: 0.6rem 1.25rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #d1d5db;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reset:hover { background: rgba(255,255,255,0.1); }

        .sim-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .sim-grid { grid-template-columns: 1fr; }
        }

        .controls-panel {
          background: rgba(17, 17, 32, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .controls-panel h3 { font-size: 1rem; font-weight: 700; margin: 0; color: #f0f0f8; }

        .control-group { display: flex; flex-direction: column; gap: 0.5rem; }

        .control-label { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #d1d5db; }

        .val-badge { font-weight: 700; font-family: monospace; }

        input[type="range"] {
          width: 100%;
          accent-color: #7c3aed;
          cursor: pointer;
        }

        .range-hints { display: flex; justify-content: space-between; font-size: 0.68rem; color: #4b5563; }

        .chip-group { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

        .chip-btn {
          padding: 0.4rem 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #9ca3af;
          font-size: 0.75rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }

        .chip-btn:hover { border-color: rgba(124,58,237,0.4); color: #e5e7eb; }
        .chip-btn.active { background: rgba(124, 58, 237, 0.15); border-color: #7c3aed; color: #a78bfa; font-weight: 600; }

        .results-panel { display: flex; flex-direction: column; gap: 1.5rem; }

        .sim-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem; gap: 1rem; color: #6b7280; background: rgba(255,255,255,0.02); border-radius: 16px;
        }

        .spinner {
          width: 36px; height: 36px; border: 3px solid rgba(124,58,237,0.2); border-top-color: #7c3aed; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .impact-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.25);
          border-radius: 16px; gap: 1rem;
        }

        .banner-left { display: flex; align-items: center; gap: 1rem; }
        .banner-icon { font-size: 2rem; }
        .banner-title { font-size: 0.85rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.05em; }
        .banner-desc { font-size: 0.95rem; color: #e5e7eb; margin-top: 0.2rem; }

        .gauge-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 0.6rem 1rem; border: 2px solid #10b981; border-radius: 12px; background: rgba(0,0,0,0.3);
          flex-shrink: 0;
        }

        .grade { font-size: 1.8rem; font-weight: 800; line-height: 1; }
        .grade-lbl { font-size: 0.65rem; color: #6b7280; text-transform: uppercase; margin-top: 2px; }

        .metrics-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .metric-box {
          padding: 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; display: flex; flex-direction: column; gap: 0.75rem;
        }

        .metric-box.highlight { border-color: rgba(52, 211, 153, 0.4); background: rgba(52, 211, 153, 0.04); }

        .m-label { font-size: 0.8rem; color: #9ca3af; font-weight: 600; }
        .m-values { display: flex; justify-content: space-between; align-items: baseline; }
        .base-val { font-size: 0.9rem; color: #6b7280; }
        .sim-val { font-size: 1.5rem; font-weight: 700; }
        .val-lbl { font-size: 0.7rem; color: #4b5563; font-weight: 400; text-transform: uppercase; }

        .recalibrated-box {
          padding: 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
        }

        .recalibrated-box h3 { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.875rem; color: #f0f0f8; }

        .recal-list { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .recal-list li { font-size: 0.88rem; color: #d1d5db; line-height: 1.5; }
      `}</style>
    </div>
  );
}
