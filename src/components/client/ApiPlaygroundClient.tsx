'use client';

import React, { useState } from 'react';
import { Key, Play, Copy, Check, Terminal, Cpu, Layers, RefreshCw, Trash2, PlusCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import type { ApiKeyItem } from '../../lib/schemas/authSchema';

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key-dev-admin',
    name: 'Developer Master Key',
    key: 'sk_dev_master_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    tier: 'Enterprise',
    rateLimit: 'Unlimited',
    requestsThisMonth: 840,
    maxMonthlyRequests: 1000000,
    createdAt: 'วันนี้',
    status: 'active',
  },
];

export function ApiPlaygroundClient() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/dev/yfinance?symbol=PTT.BK');
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST'>('GET');
  const [requestBody, setRequestBody] = useState<string>('{\n  "action": "stocks"\n}');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  // Code Snippet Tab
  const [snippetLanguage, setSnippetLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: `sk_dev_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      tier: 'Pro',
      rateLimit: '500 req/min',
      requestsThisMonth: 0,
      maxMonthlyRequests: 100000,
      createdAt: 'วันนี้',
      status: 'active',
    };
    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleExecuteApi = async () => {
    setIsExecuting(true);
    const start = performance.now();
    try {
      const res = await fetch(selectedEndpoint, {
        method: selectedMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: selectedMethod === 'POST' ? requestBody : undefined,
      });
      const data = await res.json();
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setApiResponse(
        JSON.stringify(
          {
            error: err instanceof Error ? err.message : 'API Request Failed',
            endpoint: selectedEndpoint,
          },
          null,
          2
        )
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const getCodeSnippet = () => {
    const fullUrl = `http://localhost:3000${selectedEndpoint}`;
    if (snippetLanguage === 'curl') {
      if (selectedMethod === 'POST') {
        return `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
      }
      return `curl -X GET "${fullUrl}"`;
    }

    if (snippetLanguage === 'javascript') {
      return `const response = await fetch('${fullUrl}', {\n  method: '${selectedMethod}'${selectedMethod === 'POST' ? `,\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${requestBody.replace(/\n/g, '')})` : ''}\n});\nconst data = await response.json();\nconsole.log(data);`;
    }

    return `import requests\n\nurl = "${fullUrl}"\nresponse = requests.${selectedMethod.toLowerCase()}(url${selectedMethod === 'POST' ? `, json=${requestBody.replace(/\n/g, '')}` : ''})\nprint(response.json())`;
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ padding: '10px 0', width: '100%' }}>
      {/* Dev Hub Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15), rgba(0, 122, 255, 0.1))',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-sentiment badge-bullish" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Terminal size={14} /> Dev-Only Route API Engine
              </span>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>● Python yfinance v1.7.0 Live</span>
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
              Developer API Route & yfinance Sandbox
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: '680px' }}>
              ทดสอบยิง Real-time yfinance Route API เพื่อดึงข้อมูลดิบของหุ้นไทย (SET) และหุ้นสหรัฐฯ (US) สำหรับนักพัฒนา
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Dev Route Sandbox & Endpoints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Left: Quick Endpoints & Keys */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                รายการ Dev Routes ที่พร้อมใช้งาน
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Local Dev Only</span>
          </div>

          {/* Quick Select Preset Endpoints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'ดึงหุ้น PTT.BK (Real-time yfinance)', path: '/api/dev/yfinance?symbol=PTT.BK', method: 'GET' },
              { label: 'ดึงหุ้น NVDA (US Real-time)', path: '/api/dev/yfinance?symbol=NVDA', method: 'GET' },
              { label: 'ดึงหุ้น DELTA.BK (SET Real-time)', path: '/api/dev/yfinance?symbol=DELTA.BK', method: 'GET' },
              { label: 'ดึงข้อมูลหุ้นทั้งหมด (SET & US Universe)', path: '/api/stocks/live', method: 'GET' },
            ].map((preset) => (
              <button
                key={preset.path}
                onClick={() => {
                  setSelectedEndpoint(preset.path);
                  setSelectedMethod(preset.method as 'GET' | 'POST');
                }}
                style={{
                  background: selectedEndpoint === preset.path ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: selectedEndpoint === preset.path ? '1px solid rgba(0, 122, 255, 0.4)' : '1px solid var(--glass-border)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{preset.label}</div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>{preset.path}</code>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  {preset.method}
                </span>
              </button>
            ))}
          </div>

          {/* Create Key Form */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="สร้าง Dev Token ใหม่..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreateKey}
              style={{
                background: 'var(--accent-blue)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PlusCircle size={15} /> เพิ่ม
            </button>
          </div>
        </div>

        {/* Right: API Sandbox Playground */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} color="var(--accent-bullish)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Live API Execution</h3>
            </div>
            {responseTimeMs && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-bullish)', fontWeight: 600 }}>
                ⚡ {responseTimeMs} ms (Real yfinance)
              </span>
            )}
          </div>

          {/* Endpoint Input & Method */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as 'GET' | 'POST')}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)',
                color: selectedMethod === 'GET' ? 'var(--accent-bullish)' : 'var(--accent-blue)',
                fontWeight: 800,
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>

            <input
              type="text"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />

            <button
              onClick={handleExecuteApi}
              disabled={isExecuting}
              style={{
                background: 'var(--accent-blue-gradient)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Play size={14} className={isExecuting ? 'spin' : ''} /> {isExecuting ? 'ยิง API...' : 'Run'}
            </button>
          </div>

          {/* Response Box */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>RESPONSE JSON (REAL YFINANCE)</span>
              <button
                onClick={handleCopySnippet}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกโค้ดเรียกใช้'}</span>
              </button>
            </div>
            <pre
              style={{
                background: '#090d16',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px',
                borderRadius: '12px',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                overflowX: 'auto',
                maxHeight: '260px',
                margin: 0,
              }}
            >
              {apiResponse || '// กดปุ่ม Run เพื่อทดสอบเรียก Dev Route และรับข้อมูลจริงจาก yfinance'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
