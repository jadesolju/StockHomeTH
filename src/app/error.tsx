'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { isChunkLoadError, handleChunkErrorAutoReload } from '../lib/utils/chunkErrorHelper';

export { isChunkLoadError, handleChunkErrorAutoReload };

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    console.error('App Router Error:', error);
    handleChunkErrorAutoReload(error);
  }, [error]);

  const handleRetry = () => {
    if (isChunkError && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div
        className="glass-card"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '36px',
          borderRadius: '24px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={24} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {isChunkError ? 'มีการอัปเดตเวอร์ชันใหม่ของระบบ' : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          {isChunkError
            ? 'พบการอัปเดตระบบหรือไฟล์ชั่วคราวหมดอายุ กรุณารีโหลดหน้าเว็บเพื่อโหลดเวอร์ชันล่าสุด'
            : error.message || 'ไม่สามารถเชื่อมต่อกับบริการข้อมูลได้ในขณะนี้'}
        </p>
        <button
          onClick={handleRetry}
          style={{
            background: 'var(--accent-blue)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '100px',
            padding: '10px 24px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
          }}
        >
          <RefreshCw size={14} /> ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
}
