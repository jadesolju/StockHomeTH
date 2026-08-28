import React, { useState, useEffect } from 'react';
import type { StockNewsItem } from '../types/stockNews';
import { Play, Pause, X, Volume2 } from 'lucide-react';

interface AudioPlayerWidgetProps {
  item: StockNewsItem | null;
  onClose: () => void;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ item, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setProgress((prev: number) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!item) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '640px',
      zIndex: 90,
    }}>
      <div className="glass-card" style={{
        padding: '12px 20px',
        borderRadius: '100px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        
        {/* News Info & Equalizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px var(--accent-blue-glow)'
          }}>
            <Volume2 size={20} color="#ffffff" />
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span>สรุปเสียง AI • {item.audioDuration} นาที</span>
              <span style={{ color: 'var(--accent-bullish)', fontWeight: 600 }}>● {isPlaying ? 'เล่นอยู่' : 'พัก'}</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,255,255,0.3)',
            }}
          >
            {isPlaying ? <Pause size={18} fill="#0f172a" /> : <Play size={18} fill="#0f172a" style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>

        </div>

      </div>
    </div>
  );
};
