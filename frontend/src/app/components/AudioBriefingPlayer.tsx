'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { intelligenceApi } from '../../services/api';

interface DialogueLine {
  speaker: string;
  role: string;
  text: string;
  timestamp: string;
  pitch: number;
  rate: number;
}

interface PodcastData {
  report_id: string;
  title: string;
  duration_seconds: number;
  formatted_duration: string;
  script: DialogueLine[];
  hosts: Record<string, { name: string; title: string; avatar: string }>;
}

interface AudioBriefingPlayerProps {
  reportId: string;
}

export default function AudioBriefingPlayer({ reportId }: AudioBriefingPlayerProps) {
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isPlayingRef = useRef(false);
  const currentLineRef = useRef(0);
  const speedRef = useRef(1.0);
  const playNextLineFromRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    intelligenceApi.getReportPodcast(reportId).then(data => {
      if (!mounted) return;
      if (data) setPodcast(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [reportId]);

  const stopAudio = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const playNextLineFrom = useCallback((index: number) => {
    if (!podcast || !synthRef.current || index >= podcast.script.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentLineIndex(0);
      return;
    }

    currentLineRef.current = index;
    setCurrentLineIndex(index);

    const line = podcast.script[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.rate = (line.rate || 1.0) * speedRef.current;
    utterance.pitch = line.pitch || 1.0;

    // Pick voice based on role
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google UK English Female'));
      const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK English Male'));
      if (line.role === 'analyst' && femaleVoice) utterance.voice = femaleVoice;
      else if (line.role === 'host' && maleVoice) utterance.voice = maleVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        playNextLineFromRef.current(index + 1);
      }
    };

    utterance.onerror = () => {
      if (isPlayingRef.current) {
        playNextLineFromRef.current(index + 1);
      }
    };

    synthRef.current.speak(utterance);
  }, [podcast]);

  useEffect(() => {
    playNextLineFromRef.current = playNextLineFrom;
  }, [playNextLineFrom]);


  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playNextLineFrom(currentLineIndex);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  if (loading) return null;
  if (!podcast || podcast.script.length === 0) return null;

  const activeLine = podcast.script[currentLineIndex];
  const activeSpeakerMeta = podcast.hosts[activeLine?.role] || { name: activeLine?.speaker || 'Speaker', title: 'Presenter', avatar: '🎙️' };

  return (
    <div className="audio-player-card">
      {/* Player Main Bar */}
      <div className="player-bar">
        <button className="play-btn" onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="speaker-avatar">
          {activeSpeakerMeta.avatar}
        </div>

        <div className="player-info">
          <div className="title-row">
            <span className="podcast-tag">🎙️ AI Podcast Briefing</span>
            <span className="speaker-name">{activeSpeakerMeta.name} ({activeSpeakerMeta.title})</span>
          </div>
          <div className="line-preview">
            &ldquo;{activeLine?.text || 'Click play to listen...'}&rdquo;
          </div>
        </div>

        <div className="player-controls">
          <button className="ctrl-btn speed-btn" onClick={handleSpeedChange}>
            {playbackSpeed}x
          </button>
          <button className={`ctrl-btn ${showTranscript ? 'active' : ''}`} onClick={() => setShowTranscript(p => !p)}>
            📜 Transcript
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((currentLineIndex + 1) / podcast.script.length) * 100}%` }}
        />
      </div>

      {/* Transcript Drawer */}
      {showTranscript && (
        <div className="transcript-drawer">
          <div className="drawer-header">
            <span>📜 Conversational Script ({podcast.formatted_duration})</span>
          </div>
          <div className="script-lines">
            {podcast.script.map((line, idx) => {
              const hostMeta = podcast.hosts[line.role] || { name: line.speaker, avatar: '🎙️' };
              const isActive = idx === currentLineIndex;
              return (
                <div
                  key={idx}
                  className={`script-line ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    stopAudio();
                    isPlayingRef.current = true;
                    setIsPlaying(true);
                    playNextLineFrom(idx);
                  }}
                >
                  <span className="time">{line.timestamp}</span>
                  <span className="avatar">{hostMeta.avatar}</span>
                  <div className="line-text">
                    <span className="speaker">{line.speaker}:</span> {line.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .audio-player-card {
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(15, 23, 42, 0.6));
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        .player-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
        }

        .play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: none;
          color: #fff;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 16px rgba(124, 58, 237, 0.4);
        }

        .play-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 24px rgba(124, 58, 237, 0.6);
        }

        .speaker-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .player-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .podcast-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .speaker-name {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .line-preview {
          font-size: 0.85rem;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-style: italic;
        }

        .player-controls {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .ctrl-btn {
          padding: 0.35rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #d1d5db;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ctrl-btn:hover, .ctrl-btn.active {
          background: rgba(124, 58, 237, 0.2);
          border-color: #7c3aed;
          color: #a78bfa;
        }

        .progress-track {
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          width: 100%;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #38bdf8);
          transition: width 0.3s ease;
        }

        .transcript-drawer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.2);
        }

        .drawer-header {
          font-size: 0.78rem;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .script-lines {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 240px;
          overflow-y: auto;
        }

        .script-line {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .script-line:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .script-line.active {
          background: rgba(124, 58, 237, 0.15);
          border: 1px solid rgba(124, 58, 237, 0.3);
        }

        .time {
          font-size: 0.7rem;
          color: #6b7280;
          font-family: monospace;
          margin-top: 2px;
        }

        .avatar {
          font-size: 0.9rem;
        }

        .line-text {
          font-size: 0.82rem;
          color: #d1d5db;
          line-height: 1.4;
        }

        .speaker {
          font-weight: 700;
          color: #f0f0f8;
        }
      `}</style>
    </div>
  );
}
