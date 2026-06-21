"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TranscriptLine {
  timeStr: string;
  seconds: number;
  text: string;
}

interface VideoData {
  id: string;
  title: string;
  duration: number; // in seconds
  lines: TranscriptLine[];
}

const VIDEOS: VideoData[] = [
  {
    id: "v-1",
    title: "Chakra Shorts: Awakening the Heart Node",
    duration: 35,
    lines: [
      { timeStr: "00:00", seconds: 0, text: "Currently, sound wave healing acts as a conduit to rebalance our primary nodes." },
      { timeStr: "00:06", seconds: 6, text: "By using sound bowls tuned to 528Hz, we target cellular water crystals." },
      { timeStr: "00:14", seconds: 14, text: "Key insights show that chakra blockages are often somatic reactions to stress." },
      { timeStr: "00:22", seconds: 22, text: "Practitioners can use targeted vibration maps to dissolve localized anxieties." },
      { timeStr: "00:29", seconds: 29, text: "The transcript here acts as a reference log for your personal audio sessions." },
    ],
  },
  {
    id: "v-2",
    title: "Aura Alignment & Mineral Energy Fields",
    duration: 40,
    lines: [
      { timeStr: "00:00", seconds: 0, text: "Welcome to the study of quartz energy transmissions." },
      { timeStr: "00:08", seconds: 8, text: "Crystals carry stable crystalline structures that output continuous frequencies." },
      { timeStr: "00:16", seconds: 16, text: "When placed near active nerve endings, they help normalize nervous voltage." },
      { timeStr: "00:25", seconds: 25, text: "We call this process piezo-energy stabilizing." },
      { timeStr: "00:33", seconds: 33, text: "Remember to wash your gems monthly under cold running spring water." },
    ],
  },
];

export default function VideoTranscriptsPage() {
  const [selectedVideoId, setSelectedVideoId] = useState("v-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeVideo = VIDEOS.find((v) => v.id === selectedVideoId) || VIDEOS[0];

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeVideo.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, activeVideo.duration]);

  // Switch video resets time and play state
  const handleVideoSelect = (id: string) => {
    setSelectedVideoId(id);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value, 10));
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Determine which line is currently active
  const getActiveLineIndex = () => {
    const lines = activeVideo.lines;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].seconds) {
        return i;
      }
    }
    return 0;
  };

  const activeLineIndex = getActiveLineIndex();

  const handleJumpToTime = (secs: number) => {
    setCurrentTime(secs);
    setIsPlaying(true);
  };

  return (
    <div className="transcripts-page">
      <div className="transcripts-header">
        <h1 className="page-title">Video Transcripts & Guides</h1>
        <p className="page-subtitle">
          Watch guided video segments and review precise, time-synced transcript notes.
        </p>

        {/* Video selector */}
        <div className="video-tabs">
          {VIDEOS.map((vid) => (
            <button
              key={vid.id}
              className={`video-tab-btn ${selectedVideoId === vid.id ? "active" : ""}`}
              onClick={() => handleVideoSelect(vid.id)}
            >
              {vid.title.split(":")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="player-transcript-grid">
        {/* Left: Custom Video Player */}
        <div className="player-column">
          <Card variant="glass" className="player-card">
            {/* Visual Screen Area */}
            <div className="video-screen">
              <div className="screen-overlay">
                <span className="video-meta-badge">1080p Stream</span>
              </div>
              
              {/* Animated energy orb representation */}
              <div className={`energy-orb-visual ${isPlaying ? "spinning" : ""}`}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <defs>
                    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Energy Wave Rings */}
                  <circle cx="50" cy="50" r="40" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.5" fill="none" className="energy-ring-1" />
                  <circle cx="50" cy="50" r="30" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1.5" fill="none" className="energy-ring-2" />
                  
                  {/* Glowing Core */}
                  <circle cx="50" cy="50" r="20" fill="url(#orbGlow)" className="energy-core" />
                  
                  {/* Floating particles */}
                  <circle cx="35" cy="35" r="2" fill="#22d3ee" className="particle-1" />
                  <circle cx="65" cy="40" r="2.5" fill="#facc15" className="particle-2" />
                  <circle cx="48" cy="68" r="1.5" fill="#4ade80" className="particle-3" />
                </svg>
              </div>

              {/* Subtitles text over video overlay */}
              <div className="video-subtitles-bar">
                <p className="subtitle-text">
                  {activeVideo.lines[activeLineIndex]?.text}
                </p>
              </div>
            </div>

            {/* Player Controls Bar */}
            <div className="player-controls">
              <div className="timeline-row">
                <input
                  type="range"
                  min="0"
                  max={activeVideo.duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="timeline-slider"
                />
              </div>

              <div className="buttons-row">
                <div className="play-controls">
                  <button className="control-btn" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                  
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(activeVideo.duration)}
                  </span>
                </div>

                <div className="volume-controls">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  <div className="vol-bar"></div>
                </div>
              </div>
            </div>
          </Card>

          <div className="takeaways-box glass-panel">
            <h4>Key Takeaways</h4>
            <ul>
              <li>Click on any transcript line to skip directly to that topic.</li>
              <li>Practice using headphones to maximize sound wave therapy results.</li>
            </ul>
          </div>
        </div>

        {/* Right: Synced Transcripts */}
        <div className="transcript-column">
          <div className="transcript-panel glass-panel">
            <h3 className="panel-title">Interactive Transcript</h3>
            <div className="lines-list">
              {activeVideo.lines.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                return (
                  <div
                    key={line.seconds}
                    className={`transcript-line-item ${isActive ? "active" : ""}`}
                    onClick={() => handleJumpToTime(line.seconds)}
                  >
                    <span className="timestamp">[{line.timeStr}]</span>
                    <p className="line-text">{line.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .transcripts-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .transcripts-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .page-title {
          font-size: 2.8rem;
          color: #4c1d95;
        }
        .page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
        }
        .video-tabs {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          border-bottom: 1.5px solid rgba(0,0,0,0.05);
          padding-bottom: 16px;
        }
        .video-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
        }
        .video-tab-btn:hover {
          color: #7c3aed;
        }
        .video-tab-btn.active {
          color: #7c3aed;
        }
        .video-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -17.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
        }
        .player-transcript-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          align-items: flex-start;
        }
        .player-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .player-card {
          padding: 0 !important;
          border-radius: 20px;
          overflow: hidden;
          background: #090514 !important;
          border: 1px solid rgba(168, 85, 247, 0.3) !important;
        }
        .video-screen {
          position: relative;
          height: 300px;
          background: radial-gradient(circle at center, #1b103c 0%, #060212 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .screen-overlay {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 10;
        }
        .video-meta-badge {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #22d3ee;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }
        .energy-orb-visual {
          z-index: 1;
        }
        .energy-orb-visual.spinning {
          animation: spin 20s infinite linear;
        }
        .video-subtitles-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
          padding: 30px 24px 20px;
          text-align: center;
          z-index: 5;
        }
        .subtitle-text {
          color: #ffffff;
          font-size: 1.05rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
          line-height: 1.4;
          margin: 0;
        }
        .player-controls {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #110b24;
          border-top: 1px solid rgba(168, 85, 247, 0.15);
        }
        .timeline-row {
          width: 100%;
        }
        .timeline-slider {
          width: 100%;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          height: 6px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .timeline-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 10px #c084fc;
          transition: transform 0.1s;
        }
        .timeline-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .buttons-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .play-controls {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .control-btn {
          background: transparent;
          border: none;
          color: #e9d5ff;
          cursor: pointer;
          transition: transform 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control-btn:hover {
          color: #ffffff;
          transform: scale(1.1);
        }
        .time-display {
          font-size: 0.8rem;
          color: #a78bfa;
          font-family: monospace;
        }
        .volume-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a78bfa;
        }
        .vol-bar {
          width: 60px;
          height: 4px;
          background: #7c3aed;
          border-radius: 2px;
          position: relative;
        }
        .takeaways-box {
          padding: 20px;
          border-radius: 16px;
        }
        .takeaways-box h4 {
          font-size: 1.1rem;
          color: #4c1d95;
          margin-bottom: 10px;
        }
        .takeaways-box ul {
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.88rem;
          color: hsl(var(--text-muted));
        }
        .transcript-column {
          width: 100%;
        }
        .transcript-panel {
          padding: 24px;
          border-radius: 20px;
          height: 470px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .panel-title {
          font-size: 1.3rem;
          color: #4c1d95;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 10px;
        }
        .lines-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 8px;
        }
        .transcript-line-item {
          display: flex;
          gap: 14px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: var(--transition-smooth);
        }
        .transcript-line-item:hover {
          background: rgba(168, 85, 247, 0.03);
          border-color: rgba(168, 85, 247, 0.08);
        }
        .transcript-line-item.active {
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.15) 0%, rgba(233, 213, 255, 0.15) 100%);
          border-color: rgba(168, 85, 247, 0.25);
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.03);
        }
        .timestamp {
          font-family: monospace;
          font-size: 0.85rem;
          color: #7c3aed;
          font-weight: 700;
          flex-shrink: 0;
        }
        .line-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: hsl(var(--text-cream));
          margin: 0;
        }
        .transcript-line-item.active .line-text {
          color: #4c1d95;
          font-weight: 500;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .energy-core {
          animation: pulse 4s infinite ease-in-out;
        }
        
        @keyframes orbit-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -15px) scale(0.8); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .particle-1 { animation: orbit-1 6s infinite alternate ease-in-out; }
        
        @keyframes orbit-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 8px) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .particle-2 { animation: orbit-2 8s infinite alternate-reverse ease-in-out; }

        @media (max-width: 860px) {
          .player-transcript-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
