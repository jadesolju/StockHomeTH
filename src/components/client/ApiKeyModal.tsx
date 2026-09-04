'use client';

import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose} style={{ alignItems: 'center', padding: '20px' }}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid var(--glass-border-glow)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(0, 122, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                ตั้งค่า Google Gemini API Key
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                เปิดใช้งาน AI สรุปข่าวสดใหม่ด้วย Gemini 2.5 Flash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            background: 'rgba(0, 122, 255, 0.08)',
            padding: '12px 14px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          คุณสามารถใส่ <strong>Gemini API Key</strong> ของคุณเพื่อดึงข่าวจริงและให้ AI สรุปข่าวหุ้นไทย/ต่างประเทศ หรือเว้นว่างไว้เพื่อทดลองใช้ระบบสรุปจำลองได้ฟรี
        </div>

        {/* Input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            API Key (AIzaSy...)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="วาง Gemini API Key ของคุณที่นี่..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent-blue)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>ขอรับ API Key ฟรีที่ Google AI Studio</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={handleSave}
            style={{
              background: isSaved ? 'var(--accent-bullish)' : 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '100px',
              padding: '8px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            {isSaved ? <Check size={16} /> : <Sparkles size={16} />}
            <span>{isSaved ? 'บันทึกแล้ว!' : 'บันทึก API Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
