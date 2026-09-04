import React, { useState, useEffect } from 'react';
import { developerApiService, type ApiKeyItem, type ApiResponse } from '../services/developerApiService';
import { Key, Play, Copy, Check, Terminal, Cpu, Layers, RefreshCw, Trash2, PlusCircle } from 'lucide-react';

interface DeveloperApiPortalProps {
  onRequestPreview: () => void;
}

export const DeveloperApiPortal: React.FC<DeveloperApiPortalProps> = ({ onRequestPreview }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/stocks');
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST'>('GET');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('{\n  "url": "https://example.com/finance-news"\n}');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  // Code Snippet Tab
  const [snippetLanguage, setSnippetLanguage] = useState<'curl' | 'javascript' | 'python' | 'nodejs'>('curl');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    const keys = developerApiService.getApiKeys();
    setApiKeys(keys);
    if (keys.length > 0) {
      setSelectedApiKey(keys[0].key);
    }
  }, []);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const created = developerApiService.createApiKey(newKeyName.trim());
    setApiKeys(developerApiService.getApiKeys());
    setSelectedApiKey(created.key);
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    const updated = developerApiService.revokeApiKey(id);
    setApiKeys(updated);
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleExecuteApi = () => {
    setIsExecuting(true);
    const start = performance.now();
    setTimeout(() => {
      let payload;
      if (selectedMethod === 'POST') {
        try {
          payload = JSON.parse(requestBody);
        } catch (e) {
          payload = {};
        }
      }
      const res = developerApiService.executeMockApiCall(selectedEndpoint, selectedMethod, selectedApiKey, payload);
      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setApiResponse(res);
      setIsExecuting(false);
      // Refresh usage counts in keys list
      setApiKeys(developerApiService.getApiKeys());
    }, 350);
  };

  // Generate code snippet based on selected endpoint & language
  const getCodeSnippet = () => {
    const fullUrl = `https://stockhometh.com${selectedEndpoint}`;
    if (snippetLanguage === 'curl') {
      if (selectedMethod === 'POST') {
        return `curl -X POST "${fullUrl}" \\
  -H "X-API-KEY: ${selectedApiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.replace(/\n/g, '')}'`;
      }
      return `curl -X GET "${fullUrl}" \\
  -H "X-API-KEY: ${selectedApiKey || 'YOUR_API_KEY'}"`;
    }

    if (snippetLanguage === 'javascript') {
      return `// JavaScript (Fetch API)
const response = await fetch('${fullUrl}', {
  method: '${selectedMethod}',
  headers: {
    'X-API-KEY': '${selectedApiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  }${selectedMethod === 'POST' ? `,\n  body: JSON.stringify(${requestBody.replace(/\n/g, '')})` : ''}
});

const data = await response.json();
console.log(data);`;
    }

    if (snippetLanguage === 'python') {
      return `# Python (requests)
import requests

url = "${fullUrl}"
headers = {
    "X-API-KEY": "${selectedApiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
}

response = requests.${selectedMethod.toLowerCase()}(url, headers=headers${selectedMethod === 'POST' ? `, json=${requestBody.replace(/\n/g, '')}` : ''})
print(response.json())`;
    }

    if (snippetLanguage === 'nodejs') {
      return `// Node.js (axios)
const axios = require('axios');

axios.${selectedMethod.toLowerCase()}('${fullUrl}', ${selectedMethod === 'POST' ? `${requestBody.replace(/\n/g, '')}, ` : ''}{
  headers: {
    'X-API-KEY': '${selectedApiKey || 'YOUR_API_KEY'}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`;
    }

    return '';
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      {/* Dev Hub Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15), rgba(0, 122, 255, 0.1))',
          borderColor: 'rgba(139, 92, 246, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-sentiment badge-bullish" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Terminal size={14} /> StockHome Developer Hub
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>v1.0.4 REST API</span>
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '4px 0' }}>
              ระบบ API สำหรับนักพัฒนา (Developer Portal)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '650px', lineHeight: '1.5' }}>
              ดึงข้อมูลหุ้นทั้งตลาด (SET & US), ข้อมูลปัจจัยพื้นฐาน, AI สรุปข่าวการเงิน, และดัชนีตลาดหุ้น เชื่อมต่อกับแอปพลิเคชันหรือบอทเทรดของคุณได้ทันที
            </p>
          </div>
          <button
            onClick={onRequestPreview}
            style={{
              padding: '10px 20px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px var(--accent-blue-glow)'
            }}
          >
            Request Enterprise API Rate Limit
          </button>
        </div>
      </div>

      {/* Grid Layout: API Keys & Playground */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* API Key Management Box */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={20} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>API Keys Management</h3>
          </div>

          {/* Key Generation Form */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="ตั้งชื่อ API Key (เช่น TradingBot_Key)..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '100px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCreateKey}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                background: 'var(--accent-blue)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <PlusCircle size={14} /> Create Key
            </button>
          </div>

          {/* List of Keys */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {apiKeys.map((item) => (
              <div
                key={item.id}
                style={{
                  background: item.status === 'revoked' ? 'rgba(255, 59, 48, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                  border: item.status === 'revoked' ? '1px dashed rgba(255, 59, 48, 0.3)' : '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: item.status === 'active' ? 'var(--accent-bullish-bg)' : 'rgba(255,59,48,0.2)',
                        color: item.status === 'active' ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                        fontWeight: 600
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{item.tier}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ flex: 1, fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.key}
                  </code>
                  <button
                    onClick={() => handleCopyKey(item.key, item.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    title="Copy Key"
                  >
                    {copiedKeyId === item.id ? <Check size={16} color="var(--accent-bullish)" /> : <Copy size={16} />}
                  </button>
                  {item.status === 'active' && (
                    <button
                      onClick={() => handleRevokeKey(item.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-bearish)', cursor: 'pointer' }}
                      title="Revoke Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Created: {item.createdAt}</span>
                  <span>Requests: <strong>{item.usageCount}</strong> reqs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive API Endpoint Selector & Tester */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} color="#c084fc" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Interactive API Playground</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-bullish)' }}>● API Server Online</span>
          </div>

          {/* Endpoint Selection */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedMethod}
              onChange={(e) => {
                const method = e.target.value as 'GET' | 'POST';
                setSelectedMethod(method);
                if (method === 'POST') setSelectedEndpoint('/api/v1/ai/summarize');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: selectedMethod === 'GET' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(0, 122, 255, 0.2)',
                border: '1px solid var(--glass-border)',
                color: selectedMethod === 'GET' ? 'var(--accent-bullish)' : 'var(--accent-blue)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>

            <select
              value={selectedEndpoint}
              onChange={(e) => {
                setSelectedEndpoint(e.target.value);
                if (e.target.value === '/api/v1/ai/summarize') setSelectedMethod('POST');
                else setSelectedMethod('GET');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="/api/v1/stocks?tickers=PTT,CPALL,DELTA,AOT&country=th&period=1mo">/api/v1/stocks?tickers=PTT,CPALL...&country=th (Anti-Block Bulk ดึงหุ้นไทย)</option>
              <option value="/api/v1/stocks?tickers=NVDA,AAPL,TSLA,MSFT&country=us&period=1mo">/api/v1/stocks?tickers=NVDA,AAPL...&country=us (Anti-Block Bulk ดึงหุ้นสหรัฐฯ)</option>
              <option value="/api/v1/chart/PTT.BK?period=1mo&interval=1d">/api/v1/chart/PTT.BK (ดึงแท่งเทียน OHLCV กราฟหุ้น ปตท.)</option>
              <option value="/api/v1/chart/NVDA?period=1mo&interval=1d">/api/v1/chart/NVDA (ดึงแท่งเทียน OHLCV กราฟหุ้น NVIDIA)</option>
              <option value="/api/v1/stocks">/api/v1/stocks (ดึงหุ้นทั้งตลาด SET & US)</option>
              <option value="/api/v1/stocks/NVDA">/api/v1/stocks/NVDA (หุ้น NVIDIA)</option>
              <option value="/api/v1/stocks/PTT">/api/v1/stocks/PTT (หุ้น PTT)</option>
              <option value="/api/v1/news">/api/v1/news (ดึง AI Financial News Digest)</option>
              <option value="/api/v1/market/indices">/api/v1/market/indices (ดัชนีตลาดหุ้นสด)</option>
              <option value="/api/v1/ai/summarize">/api/v1/ai/summarize (ส่งลิงก์ให้ Gemini AI สรุป)</option>
            </select>
          </div>

          {/* Header API Key Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Header: X-API-KEY</label>
            <select
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
            >
              <option value="">(ไม่มี API Key - สิทธิ์ Unauthorized)</option>
              {apiKeys.map((k) => (
                <option key={k.id} value={k.key}>
                  {k.name} - {k.key.substring(0, 18)}... [{k.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Payload if POST */}
          {selectedMethod === 'POST' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>JSON Body Payload</label>
              <textarea
                rows={3}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Send Request Button */}
          <button
            onClick={handleExecuteApi}
            disabled={isExecuting}
            style={{
              padding: '12px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #007AFF, #3b82f6)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px'
            }}
          >
            {isExecuting ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {isExecuting ? 'Executing Request...' : 'Send Test API Request'}
          </button>
        </div>
      </div>

      {/* Response Display Window & Code Snippet Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Live Response Box */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-blue)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>API Response Window</h4>
            </div>
            {apiResponse && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{responseTimeMs} ms</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '100px',
                    background: apiResponse.status === 200 ? 'var(--accent-bullish-bg)' : 'rgba(255, 59, 48, 0.2)',
                    color: apiResponse.status === 200 ? 'var(--accent-bullish)' : 'var(--accent-bearish)'
                  }}
                >
                  HTTP {apiResponse.status}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              background: '#090d16',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: '220px',
              maxHeight: '320px',
              overflowY: 'auto'
            }}
          >
            {apiResponse ? (
              <pre style={{ margin: 0, fontSize: '0.8rem', color: '#a5f3fc', fontFamily: 'monospace', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <Terminal size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <span>คลิก "Send Test API Request" เพื่อทดสอบดู JSON Response</span>
              </div>
            )}
          </div>
        </div>

        {/* Code Snippet Generator Box */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Code Snippets & SDK</h4>
            <button
              onClick={handleCopySnippet}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {copiedCode ? <Check size={12} color="var(--accent-bullish)" /> : <Copy size={12} />}
              {copiedCode ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          {/* Snippet Language Selector */}
          <div className="ios-segmented-control" style={{ padding: '2px' }}>
            {(['curl', 'javascript', 'python', 'nodejs'] as const).map((lang) => (
              <button
                key={lang}
                className={`ios-segment-btn ${snippetLanguage === lang ? 'active' : ''}`}
                onClick={() => setSnippetLanguage(lang)}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JS Fetch' : lang === 'python' ? 'Python' : 'Node.js'}
              </button>
            ))}
          </div>

          <div
            style={{
              background: '#090d16',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: '180px',
              overflowX: 'auto'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.8rem', color: '#f472b6', fontFamily: 'monospace', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
              {getCodeSnippet()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
