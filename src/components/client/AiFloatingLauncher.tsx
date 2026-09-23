'use client';

import React from 'react';
import { Send } from 'lucide-react';

export const AiFloatingLauncher: React.FC = () => {
  return (
    <aside aria-label="Telegram Bot Floating Launcher">
      <a
        href="https://t.me/StockHomeTHBot"
        target="_blank"
        rel="noopener noreferrer"
        className="ai-floating-launcher-btn"
        title="เปิดใช้งาน Telegram Bot รับสรุปข่าวหุ้น-ทองคำแท่ง ฟรี 100%"
        style={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          boxShadow: '0 4px 20px rgba(14, 165, 233, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'grid',
            placeItems: 'center',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          <Send size={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Telegram Bot
            <span
              style={{
                fontSize: '0.6rem',
                padding: '1px 5px',
                borderRadius: '100px',
                background: 'rgba(74, 222, 128, 0.25)',
                color: '#4ade80',
                fontWeight: 800,
              }}
            >
              ฟรี 0฿
            </span>
          </span>
          <span style={{ fontSize: '0.65rem', color: '#e0f2fe' }}>
            สรุปข่าว & ราคาทอง 2 รอบ/วัน
          </span>
        </div>
      </a>
    </aside>
  );
};

