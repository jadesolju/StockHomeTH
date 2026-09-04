import React from 'react';

export default function Loading() {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div
        className="glass-card"
        style={{
          maxWidth: '400px',
          margin: '0 auto',
          padding: '30px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 122, 255, 0.2)',
            borderTopColor: '#007AFF',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          กำลังโหลดข้อมูลตลาดและการวิเคราะห์ AI...
        </p>
      </div>
    </div>
  );
}
