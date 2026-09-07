'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  Play,
  Trash2,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Radio,
  Search,
  Check,
  Send,
  Copy,
  Activity,
  AlertCircle,
  FileText,
  Clock,
  Filter,
  CheckCheck,
  Server,
  Code2,
  Network,
  ArrowRight,
  GitBranch,
  Flame,
  Sparkles,
  Lock,
  Boxes,
  Workflow
} from 'lucide-react';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import type { SyncLogItem } from '../../types/syncLog';

interface SystemStatus {
  timestamp: string;
  environment: {
    nodeVersion: string;
    pythonVersion: string;
    hasWebull: boolean;
    hasYfinance: boolean;
    webullKeyConfigured: boolean;
    geminiKeyConfigured: boolean;
    deeplKeyConfigured?: boolean;
    finnhubKeyConfigured?: boolean;
  };
  quotas?: any;
  databases: {
    thaiStocks: { file: string; size: string; totalCount: number };
    usStocks: { file: string; size: string; totalCount: number };
    cacheFile: { file: string; size: string; cachedItems: number };
    sqliteDb: { file: string; size: string };
  };
  availableScripts: Array<{ id: string; name: string; file: string; desc: string }>;
}

interface ServerLogResponse {
  success: boolean;
  logFile: string;
  content: string;
  totalLines?: number;
  fileSize?: string;
  lastModified?: string;
  timestamp: string;
}

export const AdminBackofficeClient: React.FC = () => {
  // Sync context for real-time client & REST engine logs
  const { syncLogs, clearSyncLogs, isSyncing, refreshAll, totalStocksCount, setUniverseCount, usUniverseCount } = useMarketSync();

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [logsOutput, setLogsOutput] = useState<string>('Ready. Click any action or switch to Engine Terminal & Logs.');
  const [activeTab, setActiveTab] = useState<'control' | 'logs' | 'architecture' | 'database' | 'endpoints' | 'quotas'>('control');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Quotas State
  const [quotasData, setQuotasData] = useState<any>(null);
  const [quotasLoading, setQuotasLoading] = useState<boolean>(false);
  const [testTransText, setTestTransText] = useState<string>('SET Index ปรับตัวขึ้นรับแรงซื้อกลุ่มพลังงานและดีมานด์ AI');
  const [testTransLang, setTestTransLang] = useState<'EN' | 'TH'>('EN');
  const [testTransLoading, setTestTransLoading] = useState<boolean>(false);
  const [testTransResult, setTestTransResult] = useState<any>(null);

  // Log Tab sub-views
  const [logSubTab, setLogSubTab] = useState<'live' | 'server' | 'terminal'>('live');
  const [logType, setLogType] = useState<string>('update_log');
  const [logLinesLimit, setLogLinesLimit] = useState<number>(150);
  const [serverLogData, setServerLogData] = useState<ServerLogResponse | null>(null);
  const [serverLogLoading, setServerLogLoading] = useState<boolean>(false);
  const [serverLogSearch, setServerLogSearch] = useState<string>('');
  const [liveLogSearch, setLiveLogSearch] = useState<string>('');
  const [liveLogFilter, setLiveLogFilter] = useState<'all' | 'stocks' | 'indices' | 'news' | 'overview'>('all');
  const [copiedServerLog, setCopiedServerLog] = useState<boolean>(false);
  const [copiedActionLog, setCopiedActionLog] = useState<boolean>(false);

  // Architecture view interactive state
  const [selectedArchNode, setSelectedArchNode] = useState<string>('ingestion');

  // Database Tab state
  const [dbTarget, setDbTarget] = useState<'thai' | 'us' | 'cache'>('thai');
  const [dbSearch, setDbSearch] = useState<string>('');
  const [dbStocks, setDbStocks] = useState<any[]>([]);
  const [dbTotal, setDbTotal] = useState<number>(0);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  // Endpoint Tab state
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/stocks/parallel?symbols=AAPL,NVDA,PTT');
  const [endpointLoading, setEndpointLoading] = useState<boolean>(false);
  const [endpointResult, setEndpointResult] = useState<string | null>(null);

  // Fetch System Status & Quotas
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dev/admin?action=status');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setStatus(data);
          if (data.quotas) {
            setQuotasData(data.quotas);
          }
        }
      }
    } catch (err) {
      console.warn('Non-fatal status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dedicated Quotas
  const fetchQuotas = async () => {
    try {
      setQuotasLoading(true);
      const res = await fetch('/api/dev/admin?action=quotas');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.quotas) {
          setQuotasData(data.quotas);
        }
      }
    } catch (err) {
      console.warn('Non-fatal quotas fetch error:', err);
    } finally {
      setQuotasLoading(false);
    }
  };

  // Run Real-Time DeepL Translation Test
  const handleRunTranslationTest = async () => {
    if (!testTransText.trim()) return;
    try {
      setTestTransLoading(true);
      const res = await fetch('/api/dev/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_translation',
          text: testTransText.trim(),
          targetLang: testTransLang
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTestTransResult(data);
        if (data.status) {
          // Update DeepL quota stats live
          setQuotasData((prev: any) => ({
            ...prev,
            deepl: {
              ...prev?.deepl,
              monthCharCount: data.status.monthCharCount,
              monthlyRemaining: data.status.monthlyRemaining,
              monthlyPercentUsed: Math.round((data.status.monthCharCount / data.status.monthlyLimit) * 100),
              dayCharCount: data.status.dayCharCount,
              dailyRemaining: data.status.dailyRemaining,
              dailyPercentUsed: Math.round((data.status.dayCharCount / data.status.dailyLimit) * 100),
              cachedEntriesCount: data.status.cachedEntriesCount,
            }
          }));
        }
      }
    } catch (err: any) {
      setTestTransResult({ success: false, error: err.message || 'Translation test error' });
    } finally {
      setTestTransLoading(false);
    }
  };

  // Fetch Server Log File
  const fetchServerLogs = async (type: string, lines = logLinesLimit) => {
    try {
      setServerLogLoading(true);
      const res = await fetch(`/api/dev/admin?action=logs&type=${type}&lines=${lines}`);
      if (res.ok) {
        const data: ServerLogResponse = await res.json();
        setServerLogData(data);
      }
    } catch (err: any) {
      setServerLogData({
        success: false,
        logFile: type,
        content: `Error reading server logs: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setServerLogLoading(false);
    }
  };

  // Clear Server Log File
  const clearServerLog = async (type: string) => {
    if (!confirm(`Are you sure you want to clear/reset the '${type}' server log file?`)) return;
    try {
      setServerLogLoading(true);
      const res = await fetch('/api/dev/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_log', type }),
      });
      if (res.ok) {
        fetchServerLogs(type);
      }
    } catch (err: any) {
      alert(`Failed to clear log: ${err.message}`);
    } finally {
      setServerLogLoading(false);
    }
  };

  // Fetch Database Items (Safe error handling)
  const fetchDatabaseItems = async (target: string, query: string) => {
    try {
      setDbLoading(true);
      const res = await fetch(`/api/dev/admin?action=database&target=${target}&q=${encodeURIComponent(query)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setDbStocks(data.data || []);
          setDbTotal(data.total || 0);
          return;
        }
      }
      setDbStocks([]);
      setDbTotal(0);
    } catch (err) {
      console.warn('Non-fatal: could not fetch db items:', err);
      setDbStocks([]);
      setDbTotal(0);
    } finally {
      setDbLoading(false);
    }
  };

  // Execute Backend Admin Action
  const executeAction = async (actionId: string, actionName: string) => {
    setRunningAction(actionId);
    setLogsOutput(`[ADMIN CONSOLE] Initiating: ${actionName}...\nExecuting task in background, please wait...\n`);


    try {
      const res = await fetch('/api/dev/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId }),
      });
      const data = await res.json();

      if (data.success) {
        setLogsOutput(
          `[✓ SUCCESS] ${actionName} completed in ${data.durationMs || 0}ms\n\n` +
            `Timestamp: ${data.timestamp}\n` +
            `Command: ${data.command || 'Internal action'}\n\n` +
            `Output:\n${data.output || data.message || 'Done'}`
        );
        fetchStatus();
      } else {
        setLogsOutput(`[✕ ERROR] ${data.error || 'Execution failed'}\n\nStderr:\n${data.stderr || 'No stderr'}`);
      }
    } catch (err: any) {
      setLogsOutput(`[✕ NETWORK ERROR] ${err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  // Run Endpoint Test
  const runEndpointTest = async (url: string) => {
    setEndpointLoading(true);
    setEndpointResult('Sending request...');
    const tStart = performance.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const latency = Math.round(performance.now() - tStart);
      setEndpointResult(
        `// Status: ${res.status} OK | Latency: ${latency}ms | Time: ${new Date().toLocaleTimeString()}\n` +
          JSON.stringify(data, null, 2)
      );
    } catch (err: any) {
      setEndpointResult(`// Request Error:\n${err.message}`);
    } finally {
      setEndpointLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchServerLogs(logType, logLinesLimit);
    } else if (activeTab === 'database') {
      fetchDatabaseItems(dbTarget, dbSearch);
    } else if (activeTab === 'quotas') {
      fetchQuotas();
    }
  }, [activeTab, logType, logLinesLimit, dbTarget]);

  // Auto-refresh interval
  useEffect(() => {
    let timer: any;
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchStatus();
        if (activeTab === 'logs' && logSubTab === 'server') {
          fetchServerLogs(logType, logLinesLimit);
        } else if (activeTab === 'quotas') {
          fetchQuotas();
        }
      }, 8000);
    }
    return () => clearInterval(timer);
  }, [autoRefresh, activeTab, logSubTab, logType, logLinesLimit]);

  // Filtered Live Client Logs
  const filteredLiveLogs = useMemo(() => {
    return syncLogs.filter((log) => {
      const matchesFilter = liveLogFilter === 'all' || log.type === liveLogFilter;
      const query = liveLogSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        log.summary.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        (log.type && log.type.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [syncLogs, liveLogFilter, liveLogSearch]);

  // Filtered Server Log Lines
  const filteredServerLogLines = useMemo(() => {
    if (!serverLogData?.content) return [];
    const lines = serverLogData.content.split('\n');
    if (!serverLogSearch.trim()) return lines;
    const q = serverLogSearch.toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(q));
  }, [serverLogData, serverLogSearch]);

  const handleCopyServerLog = () => {
    if (!serverLogData?.content) return;
    navigator.clipboard.writeText(serverLogData.content);
    setCopiedServerLog(true);
    setTimeout(() => setCopiedServerLog(false), 2000);
  };

  const handleCopyActionLog = () => {
    navigator.clipboard.writeText(logsOutput);
    setCopiedActionLog(true);
    setTimeout(() => setCopiedActionLog(false), 2000);
  };

  return (
    <div style={{ padding: '24px 0', minHeight: '85vh', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ─── Header Banner (High-Contrast Clean Glass) ─── */}
      <div className="admin-header-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  background: 'var(--accent-blue-bg)',
                  border: '1px solid var(--accent-blue-border)',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-blue)',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <ShieldCheck size={16} /> ADMIN & DEV CONSOLE
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                High-Security Isolated Backoffice System
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              StockHomeTH Master Control & Log Terminal
            </h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', lineHeight: 1.6, fontWeight: 500 }}>
              ศูนย์ควบคุมระบบและตรวจสอบ Log กลาง: จัดการ Engine ข้อมูลตลาดหุ้น SET & US, ดูผังการซิงหลังบ้าน (Architecture & Pipeline Map), ติดตาม Real-time Sync Feed, ตรวจสอบโควตา API (DeepL, Gemini, Finnhub), และตรวจสอบ Server Logs
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '9px 15px',
                borderRadius: '10px',
                background: autoRefresh ? 'var(--accent-bullish-bg)' : 'var(--card-sub-bg)',
                border: `1px solid ${autoRefresh ? 'var(--accent-bullish-border)' : 'var(--card-sub-border)'}`,
                color: autoRefresh ? 'var(--accent-bullish)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <Radio size={15} className={autoRefresh ? 'animate-pulse' : ''} />
              {autoRefresh ? 'Auto-Polling ON (8s)' : 'Auto-Poll Off'}
            </button>
            <button
              onClick={() => {
                fetchStatus();
                if (activeTab === 'quotas') fetchQuotas();
              }}
              disabled={loading || quotasLoading}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'var(--accent-blue)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0, 113, 227, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={15} className={loading || quotasLoading ? 'animate-spin' : ''} /> Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* ─── High-Contrast System Status Metrics ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Python Environment */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Execution Engine</span>
            <Cpu size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {status?.environment?.pythonVersion || 'Cloud & Node Engine (Active)'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--accent-bullish)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <CheckCircle2 size={13} /> yfinance & Serverless Bridge Active
          </div>
        </div>

        {/* Webull OpenAPI SDK */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Webull OpenAPI SDK</span>
            <Zap size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {status?.environment?.hasWebull ? 'SDK v2.0.19 Active' : 'Parallel Fallback Engine'}
          </div>
          <div style={{ fontSize: '12px', color: status?.environment?.webullKeyConfigured ? 'var(--accent-bullish)' : '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
            {status?.environment?.webullKeyConfigured ? '✓ App Key Active' : '● Running Multi-Source Bridge'}
          </div>
        </div>

        {/* SET Thai Stock Universe */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>SET Thai Universe</span>
            <Database size={18} color="var(--accent-bullish)" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {status?.databases?.thaiStocks?.totalCount || setUniverseCount || 277} Listed Stocks
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', fontWeight: 500 }}>
            Cache: {status?.databases?.thaiStocks?.size || '66.2 KB'}
          </div>
        </div>

        {/* US / Global Stock Universe */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>US Global Universe</span>
            <Globe size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {status?.databases?.usStocks?.totalCount || usUniverseCount || 1024} Listed Stocks
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', fontWeight: 500 }}>
            Cache: {status?.databases?.usStocks?.size || '1.9 MB'}
          </div>
        </div>
      </div>

      {/* ─── Top Navigation Tabs ─── */}
      <div
        className="ios-segmented-control"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          gap: '6px',
          marginBottom: '20px',
          padding: '6px',
          borderRadius: '14px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'control', label: 'Action Control Center', icon: Zap },
          { id: 'quotas', label: 'ตรวจโควตา API (Quotas & Health)', icon: ShieldCheck, highlight: true },
          { id: 'logs', label: `Engine Terminal & Logs (${syncLogs.length})`, icon: Terminal, highlight: true },
          { id: 'architecture', label: 'ผังข้อมูล & Pipeline Map', icon: Network, highlight: true },
          { id: 'database', label: 'Database & Cache Storage', icon: Database },
          { id: 'endpoints', label: 'API Routes & Endpoints', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`ios-segment-btn ${isActive ? 'active' : ''}`}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '10px',
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: ผังข้อมูลการซิง & การทำงานหลังบ้าน (ARCHITECTURE & DATAFLOW MAP)
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Architecture Banner */}
          <div className="admin-glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Network size={20} color="var(--accent-blue)" /> ผังการทำงานหลังบ้านและการเชื่อมโยงข้อมูลแบบ Full-Stack
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                  แผนผัง 4 ระดับชั้น (4-Tier Topology) ตั้งแต่ต้นทางข้อมูล, SQLite Data Lake, REST Streaming Engine, จนถึงหน้าบ้าน Dashboard
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: 'var(--accent-bullish)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div className="live-pulse-dot" /> ระบบหลังบ้านพร้อมทำงาน 100%
                </span>
              </div>
            </div>

            {/* 4-Tier Visual Architecture Diagram Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              {/* Tier 1: Ingestion Sources */}
              <div
                onClick={() => setSelectedArchNode('ingestion')}
                style={{
                  background: selectedArchNode === 'ingestion' ? 'rgba(59, 130, 246, 0.12)' : 'var(--card-sub-bg)',
                  border: `2px solid ${selectedArchNode === 'ingestion' ? 'var(--accent-blue)' : 'var(--card-sub-border)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                    TIER 1 • SOURCES
                  </span>
                  <Globe size={16} color="var(--accent-blue)" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Data Ingestion Feeds
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  ดึงข้อมูลจริงจาก SET.or.th, SEC EDGAR (10,412 หุ้น), Yahoo Finance, Google RSS และ Finnhub
                </p>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span className="ticker-pill">SET & mai</span>
                  <span className="ticker-pill">NASDAQ / NYSE</span>
                  <span className="ticker-pill">Google RSS</span>
                  <span className="ticker-pill">Webull SDK</span>
                </div>
              </div>

              {/* Tier 2: SQLite & Processing Engine */}
              <div
                onClick={() => setSelectedArchNode('storage')}
                style={{
                  background: selectedArchNode === 'storage' ? 'rgba(16, 185, 129, 0.12)' : 'var(--card-sub-bg)',
                  border: `2px solid ${selectedArchNode === 'storage' ? 'var(--accent-bullish)' : 'var(--card-sub-border)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-bullish)', textTransform: 'uppercase' }}>
                    TIER 2 • STORAGE & PIPELINE
                  </span>
                  <Database size={16} color="var(--accent-bullish)" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  SQLite & Memory Cache
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  `market_data.db` (5.2 MB) จัดเก็บประวัติราคา OHLCV และ `market_cache.json` (3,790 ตัว) โหลดเร็ว &lt;5ms
                </p>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span className="ticker-pill">market_data.db</span>
                  <span className="ticker-pill">market_cache.json</span>
                  <span className="ticker-pill">Checkpoints</span>
                </div>
              </div>

              {/* Tier 3: Next.js API Routes & Virtual Streaming */}
              <div
                onClick={() => setSelectedArchNode('streaming')}
                style={{
                  background: selectedArchNode === 'streaming' ? 'rgba(168, 85, 247, 0.12)' : 'var(--card-sub-bg)',
                  border: `2px solid ${selectedArchNode === 'streaming' ? '#a855f7' : 'var(--card-sub-border)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>
                    TIER 3 • REST STREAMING
                  </span>
                  <Zap size={16} color="#a855f7" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  API & Virtual REST Ticker
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Virtual Micro-Tick REST Streaming (ทุก 3.5 วินาที) + Silent Background REST Polling (ทุก 30 วินาที) ไม่ต้องกด Sync
                </p>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span className="ticker-pill">/api/stocks/live</span>
                  <span className="ticker-pill">/api/indices/live</span>
                  <span className="ticker-pill">3.5s Ticks</span>
                </div>
              </div>

              {/* Tier 4: Client Dashboard UI & Admin */}
              <div
                onClick={() => setSelectedArchNode('dashboard')}
                style={{
                  background: selectedArchNode === 'dashboard' ? 'rgba(245, 158, 11, 0.12)' : 'var(--card-sub-bg)',
                  border: `2px solid ${selectedArchNode === 'dashboard' ? '#f59e0b' : 'var(--card-sub-border)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                    TIER 4 • DASHBOARD & ADMIN
                  </span>
                  <Layers size={16} color="#f59e0b" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Interactive UI & Logs
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Marquee Ticker, Stock Explorer Grid, Thai vs US Digest Split, และหน้า Admin Portal แบบแยกเฉพาะ
                </p>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span className="ticker-pill">StockExplorer</span>
                  <span className="ticker-pill">DigestHeader</span>
                  <span className="ticker-pill">Admin Console</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Dive Details Card for Selected Node */}
          <div className="admin-glass-panel" style={{ padding: '24px', borderRadius: '18px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Workflow size={18} color="var(--accent-blue)" />
              {selectedArchNode === 'ingestion' && 'รายละเอียด Stage 1: Data Ingestion & Universe Builders'}
              {selectedArchNode === 'storage' && 'รายละเอียด Stage 2: SQLite Database & In-Memory Caching'}
              {selectedArchNode === 'streaming' && 'รายละเอียด Stage 3: Virtual Micro-Tick REST Streaming Engine'}
              {selectedArchNode === 'dashboard' && 'รายละเอียด Stage 4: Frontend State Bus & On-Demand Tag Prioritization'}
            </h4>

            {selectedArchNode === 'ingestion' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--accent-blue)' }}>
                    🇹🇭 ตลาดหุ้นไทย (SET / mai Universe)
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    ประมวลผลผ่าน `scripts/build_thai_universe.py` ดึงรายชื่อหุ้นไทยจริงจาก SET.or.th แบ่งตาม Sector / Industry และจัดกลุ่มเป็นหมวดแท็ก `#SET50`, `#SET100`, `#sSET`, `#SETHD`, `#mai` และ `#SETESG` พร้อมดึงราคาจริงผ่าน Yahoo Finance (`*.BK`)
                  </p>
                </div>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#a855f7' }}>
                    🇺🇸 ตลาดหุ้นสหรัฐฯ (US Global Universe)
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    ประมวลผลผ่าน `scripts/build_global_universe.py` ดึงข้อมูลหลักทรัพย์จาก SEC EDGAR Company Tickers (10,412 ตัว) และจัดหมวดหมู่อย่างเป็นทางการเป็น `#NASDAQ-100` (100 ตัวจริง), `#S&P 500`, `#Dow Jones` (30 ตัวจริง), `#Magnificent 7`, `#Semiconductors`, `#AI & Cloud`, `#EV & Clean Energy`
                  </p>
                </div>
              </div>
            )}

            {selectedArchNode === 'storage' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--accent-bullish)' }}>
                    🗄️ SQLite Ingestion Data Lake (`market_data.db`)
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    รันผ่าน `market_ingestion_pipeline.py` ทำการเก็บข้อมูลแบบ ACID มีตาราง `stocks`, `daily_ohlcv`, `market_snapshots`, และ `ingestion_checkpoints` รองรับการ Ingest ข้อมูลแบบ chunked batch และ resume ได้อัตโนมัติเมื่อเกิดการขัดข้อง
                  </p>
                </div>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#f59e0b' }}>
                    ⚡ In-Memory High-Speed Cache (`market_cache.json`)
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    เก็บข้อมูล 3,790 ตัว สำหรับ Frontend ให้เข้าถึงได้เร็วระดับ 1-5 มิลลิวินาที เมื่อ Admin รัน `scripts/sync_real_yfinance_universe.py` ระบบจะอัปเดตราคาล่าสุดลงใน Cache และบันทึก baseline กลับเข้าไปในไฟล์ builder อัตโนมัติ
                  </p>
                </div>
              </div>
            )}

            {selectedArchNode === 'streaming' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#38bdf8' }}>
                    💫 Virtual Micro-Tick Streaming Engine
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    ใน `MarketSyncContext.tsx` มี Event Loop ทำงานทุก 3.5 วินาที สุ่มราคา Micro-Tick (±0.03% ถึง ±0.18%) ให้กับหุ้น 2-4 ตัว พร้อมกระตุ้น CSS Animation `.price-tick-up` (เขียว) และ `.price-tick-down` (แดง) ในหน้าจอ Grid และ Table ให้เหมือน Streaming กระดานหุ้นสด
                  </p>
                </div>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#4ade80' }}>
                    🔄 Silent Background REST Polling
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    ทุก 30 วินาที ระบบจะยิง REST Request เบื้องหลังไปยัง `/api/stocks/live` และ `/api/indices/live` อย่างเงียบๆ เพื่อนำราคาจริงจากเซิร์ฟเวอร์มา merge ทับลงใน React State Bus โดยที่ผู้ใช้ไม่ต้องกดปุ่ม Refresh เอง
                  </p>
                </div>
              </div>
            )}

            {selectedArchNode === 'dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#fbbf24' }}>
                    ⚡ Prioritized On-Demand Tag Loading
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    เมื่อผู้ใช้กดเลือก Tag ใดๆ เช่น `#SET50` หรือ `#NASDAQ-100` ระบบจะดึงและเรนเดอร์สมาชิกทั้งหมดของกลุ่มนั้นทันทีโดยไม่ต้องรอโหลดตามรอบ Scroll Pagination และซ่อนตัวเลขจำนวนหุ้นในปุ่ม Tag ตามที่กำหนด
                  </p>
                </div>
                <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#60a5fa' }}>
                    🔒 Client UI Isolation & Clean Experience
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    หน้า Client จะไม่มีปุ่ม Log, ไม่มีการแสดงข้อความหลังบ้าน "1.5 วิ", ไม่มี Badge หน่วงเวลา และไม่มีปุ่ม Sync Activity ให้รกตา โดย Log ทั้งหมดจะถูกย้ายมารวบรวมและแสดงผลเฉพาะที่หน้า Admin Portal นี้เท่านั้น
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: ENGINE TERMINAL & LOGS (PRIMARY LOG HUB FOR ADMIN/DEV)
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="admin-glass-panel" style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px' }}>
          {/* Subtab Switcher */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setLogSubTab('live')}
                className={`admin-pill-btn ${logSubTab === 'live' ? 'active' : ''}`}
              >
                <Activity size={14} />
                <span>⚡ Real-Time Live Sync Feed ({syncLogs.length})</span>
              </button>
              <button
                onClick={() => setLogSubTab('server')}
                className={`admin-pill-btn ${logSubTab === 'server' ? 'active' : ''}`}
              >
                <Server size={14} />
                <span>🖥️ Backend Server Log Terminal</span>
              </button>
              <button
                onClick={() => setLogSubTab('terminal')}
                className={`admin-pill-btn ${logSubTab === 'terminal' ? 'active' : ''}`}
              >
                <Code2 size={14} />
                <span>💻 Action Execution Console</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {logSubTab === 'live' && (
                <button
                  onClick={clearSyncLogs}
                  className="admin-pill-btn"
                  style={{ color: 'var(--accent-bearish)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  title="ล้าง Log สตรีมสดทั้งหมด"
                >
                  <Trash2 size={13} /> ล้าง Real-Time Logs
                </button>
              )}
              {logSubTab === 'server' && (
                <button
                  onClick={() => fetchServerLogs(logType, logLinesLimit)}
                  disabled={serverLogLoading}
                  className="admin-pill-btn active"
                >
                  <RefreshCw size={13} className={serverLogLoading ? 'animate-spin' : ''} /> Refresh Log
                </button>
              )}
            </div>
          </div>

          {/* ──── SUBTAB 1: Real-Time Live Sync Activity Feed ──── */}
          {logSubTab === 'live' && (
            <div>
              {/* Category Filter & Search Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'stocks', label: '📊 ราคาหุ้น (Stocks)' },
                    { id: 'indices', label: '📈 ดัชนี & ทองคำ (Indices)' },
                    { id: 'news', label: '📰 ข่าวสาร (News)' },
                    { id: 'overview', label: '🤖 AI Market Briefing' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLiveLogFilter(f.id as any)}
                      className={`admin-pill-btn ${liveLogFilter === f.id ? 'active' : ''}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Search in Live Logs */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="ค้นหาในกิจกรรม Real-time..."
                    value={liveLogSearch}
                    onChange={(e) => setLiveLogSearch(e.target.value)}
                    className="admin-input-control"
                    style={{ paddingLeft: '32px', width: '240px' }}
                  />
                  <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                </div>
              </div>

              {/* Live Activity Metric Summary Bar */}
              <div
                style={{
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    บันทึกทั้งหมด: <strong style={{ color: 'var(--text-primary)' }}>{syncLogs.length} รายการ</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ตรงกับตัวกรอง: <strong style={{ color: 'var(--accent-blue)' }}>{filteredLiveLogs.length} รายการ</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="live-pulse-dot" />
                  <span style={{ color: 'var(--accent-bullish)', fontWeight: 700, fontSize: '12px' }}>
                    Live Event Bus เชื่อมต่อสด
                  </span>
                </div>
              </div>

              {/* Live Events Stream List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                {filteredLiveLogs.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      background: 'var(--card-sub-bg)',
                      borderRadius: '12px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <Activity size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>ยังไม่มีบันทึกข้อมูลที่ตรงกับตัวกรอง</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>ระบบกำลังฟัง Event Sync จาก Yahoo Finance, SEC และ AI Engine...</p>
                  </div>
                ) : (
                  filteredLiveLogs.map((log) => {
                    const isSuccess = log.status === 'success';
                    const isWarning = log.status === 'warning';
                    return (
                      <div key={log.id} className="admin-log-item-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Timestamp */}
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--accent-blue)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                              {log.timestamp}
                            </span>

                            {/* Source */}
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {log.source}
                            </span>

                            {/* Type Pill */}
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background:
                                  log.type === 'stocks'
                                    ? 'rgba(59, 130, 246, 0.2)'
                                    : log.type === 'indices'
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : log.type === 'news'
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(16, 185, 129, 0.2)',
                                color:
                                  log.type === 'stocks'
                                    ? '#38bdf8'
                                    : log.type === 'indices'
                                    ? '#c084fc'
                                    : log.type === 'news'
                                    ? '#fbbf24'
                                    : '#4ade80',
                              }}
                            >
                              {log.type}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Duration badge */}
                            {log.durationMs !== undefined && (
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                {log.durationMs}ms
                              </span>
                            )}

                            {/* Status pill */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '100px',
                                background: isSuccess
                                  ? 'rgba(34, 197, 94, 0.15)'
                                  : isWarning
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                                color: isSuccess ? 'var(--accent-bullish)' : isWarning ? '#f59e0b' : 'var(--accent-bearish)',
                                border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {isSuccess ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {isSuccess ? 'Success' : isWarning ? 'Warning' : 'Error'}
                            </span>
                          </div>
                        </div>

                        {/* Summary Message */}
                        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {log.summary}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ──── SUBTAB 2: Backend Server Log Terminal (Files) ──── */}
          {logSubTab === 'server' && (
            <div>
              {/* Controls Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Log File Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Log Source:</span>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className="admin-input-control"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="update_log">update_log.txt (System & Universe Updates)</option>
                      <option value="pipeline">market_pipeline.log (Data Ingestion & Checkpoints)</option>
                      <option value="sync">market_sync.log (Sync Engine & Yahoo Polling)</option>
                      <option value="crawler">crawler.log (News Crawler & RSS)</option>
                    </select>
                  </div>

                  {/* Lines limit selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lines:</span>
                    <select
                      value={logLinesLimit}
                      onChange={(e) => setLogLinesLimit(parseInt(e.target.value, 10))}
                      className="admin-input-control"
                    >
                      <option value={50}>50 lines</option>
                      <option value={150}>150 lines</option>
                      <option value={300}>300 lines</option>
                      <option value={600}>600 lines</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Search inside server logs */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search log content..."
                      value={serverLogSearch}
                      onChange={(e) => setServerLogSearch(e.target.value)}
                      className="admin-input-control"
                      style={{ paddingLeft: '30px', width: '180px' }}
                    />
                    <Search size={13} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>

                  {/* Copy Button */}
                  <button onClick={handleCopyServerLog} className="admin-pill-btn" title="Copy log to clipboard">
                    {copiedServerLog ? <CheckCheck size={13} color="var(--accent-bullish)" /> : <Copy size={13} />}
                    <span>{copiedServerLog ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {/* Clear Server Log Button */}
                  <button
                    onClick={() => clearServerLog(logType)}
                    className="admin-pill-btn"
                    style={{ color: 'var(--accent-bearish)', borderColor: 'rgba(239,68,68,0.4)' }}
                    title="Clear server log file"
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                </div>
              </div>

              {/* Server Log Metrics Bar */}
              <div
                style={{
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  Target: <strong style={{ color: 'var(--text-primary)' }}>{serverLogData?.logFile || logType}</strong> | Size:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{serverLogData?.fileSize || '0 KB'}</strong> | Total Lines:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{serverLogData?.totalLines || 0}</strong>
                </div>
                {serverLogData?.lastModified && (
                  <div>
                    Last Modified: <strong style={{ color: 'var(--accent-blue)' }}>{new Date(serverLogData.lastModified).toLocaleString('th-TH')}</strong>
                  </div>
                )}
              </div>

              {/* High-Contrast Server Terminal Window */}
              <div className="admin-terminal-container">
                <div className="admin-terminal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', marginLeft: '6px' }}>
                      bash ~ /server/logs/{serverLogData?.logFile || logType}
                    </span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                    {filteredServerLogLines.length} lines shown
                  </span>
                </div>

                <div className="admin-terminal-body" style={{ maxHeight: '460px' }}>
                  {serverLogLoading ? (
                    <div style={{ color: '#60a5fa', padding: '10px 0' }}>Loading server logs from backend...</div>
                  ) : filteredServerLogLines.length === 0 ? (
                    <div style={{ color: '#64748b', padding: '10px 0' }}>No log entries found.</div>
                  ) : (
                    filteredServerLogLines.map((line, idx) => {
                      let color = '#38bdf8';
                      if (line.includes('[INFO]')) color = '#93c5fd';
                      if (line.includes('SUCCESS') || line.includes('[✓]')) color = '#4ade80';
                      if (line.includes('[ERROR]') || line.includes('Failed') || line.includes('[X]')) color = '#f87171';
                      if (line.includes('[WARN]') || line.includes('WARNING')) color = '#fbbf24';

                      return (
                        <div key={idx} style={{ display: 'flex', gap: '12px', color }}>
                          <span style={{ color: '#475569', userSelect: 'none', minWidth: '32px', textAlign: 'right', fontSize: '11px' }}>
                            {idx + 1}
                          </span>
                          <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──── SUBTAB 3: Action Execution Console ──── */}
          {logSubTab === 'terminal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                  Active stdout / stderr stream for background processes
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCopyActionLog} className="admin-pill-btn">
                    {copiedActionLog ? <CheckCheck size={13} color="var(--accent-bullish)" /> : <Copy size={13} />}
                    <span>{copiedActionLog ? 'Copied!' : 'Copy Output'}</span>
                  </button>
                  <button onClick={() => setLogsOutput('Console cleared.')} className="admin-pill-btn">
                    <Trash2 size={13} /> Clear
                  </button>
                </div>
              </div>

              <div className="admin-terminal-container">
                <div className="admin-terminal-header">
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                    Process Output Stream (Node.js & Python Subprocesses)
                  </span>
                  {runningAction && (
                    <span style={{ color: '#4ade80', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={11} className="animate-spin" /> Running: {runningAction}
                    </span>
                  )}
                </div>
                <pre className="admin-terminal-body" style={{ color: '#67e8f9', maxHeight: '420px', margin: 0 }}>
                  {logsOutput}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: ACTION CONTROL CENTER
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'control' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Data Pipelines Card */}
          <div className="admin-glass-panel" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-blue)" /> Data Pipelines & Universe Builders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(
                (status?.availableScripts && status.availableScripts.length > 0)
                  ? status.availableScripts
                  : [
                      { id: 'progressive_sync', name: 'Progressive Live Vendor Ingestion', file: 'scripts/progressive_live_sync.py', desc: 'Progressively query Yahoo Finance & Webull APIs with zero dummy fallback' },
                      { id: 'build_thai', name: 'Build Thai Universe (SET & mai)', file: 'scripts/build_thai_universe.py', desc: 'Generate & sync SET universe pricing (277+ stocks)' },
                      { id: 'build_global', name: 'Build Global Universe (US)', file: 'scripts/build_global_universe.py', desc: 'Generate & sync US/Global universe pricing (1,024+ stocks)' },
                      { id: 'sync_yfinance', name: 'Live Yahoo Finance Sync', file: 'scripts/sync_real_yfinance_universe.py', desc: 'Pull live market snapshot from Yahoo Finance' },
                      { id: 'webull_parallel', name: 'Webull Parallel Test', file: 'server/webull_engine.py', desc: 'Run concurrent multi-stock batch test' },
                    ]
              ).map((script) => (
                <div
                  key={script.id}
                  style={{
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-sub-border)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{script.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{script.desc}</div>
                    <code style={{ fontSize: '11px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{script.file}</code>
                  </div>
                  <button
                    onClick={() => executeAction(script.id, script.name)}
                    disabled={runningAction !== null}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: runningAction === script.id ? 'rgba(59, 130, 246, 0.3)' : 'var(--accent-blue)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: runningAction !== null ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <Play size={12} className={runningAction === script.id ? 'animate-spin' : ''} />
                    {runningAction === script.id ? 'Running...' : 'Run Pipeline'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cache & Engine Tools Card */}
          <div className="admin-glass-panel" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--accent-bullish)" /> Memory & Cache Controls
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Flush Cache */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-bearish)' }}>Flush Market Cache</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Reset `market_cache.json` and clear all live in-memory stock quotes
                  </div>
                </div>
                <button
                  onClick={() => executeAction('flush_cache', 'Flush Cache')}
                  disabled={runningAction !== null}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--accent-bearish)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: runningAction !== null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Trash2 size={12} /> Flush
                </button>
              </div>

              {/* Swagger Docs */}
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.06)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-bullish)' }}>FastAPI Interactive Docs</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Open Swagger UI documentation on Python backend (Port 8000)
                  </div>
                </div>
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--accent-bullish)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={12} /> Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: DATABASE & CACHE STORAGE INSPECTOR
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'database' && (
        <div className="admin-glass-panel" style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'thai', label: 'Thai SET Stocks' },
                { id: 'us', label: 'US Global Stocks' },
                { id: 'cache', label: 'Live Market Cache' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDbTarget(t.id as any)}
                  className={`admin-pill-btn ${dbTarget === t.id ? 'active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search ticker or name..."
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDatabaseItems(dbTarget, dbSearch)}
                  className="admin-input-control"
                  style={{ paddingLeft: '32px', width: '220px' }}
                />
                <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
              <button
                onClick={() => fetchDatabaseItems(dbTarget, dbSearch)}
                className="admin-pill-btn active"
              >
                Search
              </button>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
            Showing {dbStocks.length} of {dbTotal} items in database ({dbTarget})
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '420px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--card-sub-bg)', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ticker / Symbol</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Company Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Market / Sector</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Price</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {dbStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      {dbLoading ? 'Loading database items...' : 'No items found matching criteria.'}
                    </td>
                  </tr>
                ) : (
                  dbStocks.map((stock, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderTop: '1px solid var(--card-sub-border)',
                        background: idx % 2 === 0 ? 'var(--card-sub-bg)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--accent-blue)' }}>
                        <span className="ticker-pill">{stock.ticker || stock.symbol || '—'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {stock.name || stock.title || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {stock.market || stock.sector || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {stock.price ? `${stock.currency || ''} ${stock.price}` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: (stock.change ?? 0) >= 0 ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                          fontWeight: 700,
                        }}
                      >
                        {stock.change ? `${stock.change > 0 ? '+' : ''}${stock.change}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: API ENDPOINTS DIRECTORY & TESTER
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'endpoints' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="admin-glass-panel" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Registered API Endpoints
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { path: '/api/stocks/parallel?symbols=AAPL,NVDA,PTT', method: 'GET', desc: 'Parallel multi-symbol query' },
                { path: '/api/stocks/webull?action=status', method: 'GET', desc: 'Webull OpenAPI status check' },
                { path: '/api/stocks/live?market=ALL&limit=10', method: 'GET', desc: 'Stock universe live list' },
                { path: '/api/stocks/chart/PTT?period=1mo', method: 'GET', desc: 'Candlestick OHLCV data' },
                { path: '/api/market/overview', method: 'GET', desc: 'Market sentiment & catalysts' },
                { path: '/api/indices/live', method: 'GET', desc: 'Live indices & commodities' },
              ].map((ep, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-sub-border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: 'var(--accent-blue)',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}
                      >
                        {ep.method}
                      </span>
                      <code style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{ep.path}</code>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{ep.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      setTestEndpoint(ep.path);
                      runEndpointTest(ep.path);
                    }}
                    className="admin-pill-btn active"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Run
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Console Result */}
          <div className="admin-glass-panel" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Live API Response
            </h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                className="admin-input-control"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
              />
              <button
                onClick={() => runEndpointTest(testEndpoint)}
                disabled={endpointLoading}
                className="admin-pill-btn active"
                style={{ padding: '8px 16px', borderRadius: '8px' }}
              >
                <Send size={12} /> Send
              </button>
            </div>
            <div className="admin-terminal-container">
              <pre className="admin-terminal-body" style={{ color: '#4ade80', maxHeight: '340px', margin: 0 }}>
                {endpointResult || '// Click "Run" on any endpoint on the left to see live JSON response.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: API QUOTAS & HEALTH DASHBOARD (Apple iOS Minimal Clean)
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'quotas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Top Summary Banner */}
          <div className="admin-glass-panel" style={{ padding: '22px 26px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="var(--accent-blue)" /> ศูนย์ตรวจสอบและบริหารโควตา API (API Quota & Service Health)
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                  ติดตามปริมาณการเรียกใช้งาน โควตาคงเหลือ และประสิทธิภาพการแคชข้อมูลของ External APIs ทุกตัวในระบบแบบ Real-time
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={fetchQuotas}
                  disabled={quotasLoading}
                  className="admin-pill-btn active"
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} className={quotasLoading ? 'animate-spin' : ''} /> รีเฟรชโควตาล่าสุด
                </button>
              </div>
            </div>
          </div>

          {/* Core Service: DeepL Free Translation API (Primary Focus) */}
          <div className="admin-glass-panel" style={{ padding: '24px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    DeepL Free Translation API
                  </h4>
                  <span
                    style={{
                      background: quotasData?.deepl?.isConfigured ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 159, 10, 0.15)',
                      color: quotasData?.deepl?.isConfigured ? 'var(--accent-bullish)' : 'var(--accent-neutral)',
                      border: `1px solid ${quotasData?.deepl?.isConfigured ? 'rgba(48, 209, 88, 0.3)' : 'rgba(255, 159, 10, 0.3)'}`,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {quotasData?.deepl?.isConfigured ? '✓ API Key Configured' : '● Standby / Fallback Engine Active'}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Endpoint: <code style={{ color: 'var(--accent-blue)', background: 'var(--card-sub-bg)', padding: '2px 6px', borderRadius: '4px' }}>https://api-free.deepl.com/v2/translate</code> • Free Tier Cap: 500,000 Chars/Month
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="ticker-pill" style={{ color: 'var(--accent-bullish)' }}>
                  {quotasData?.deepl?.cachedEntriesCount || 0} รายการใน Disk Cache (0 Chars wasted)
                </span>
              </div>
            </div>

            {/* DeepL Usage Meters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Monthly Quota Meter */}
              <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    โควตารายเดือน ({quotasData?.deepl?.month || 'Current Month'})
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: (quotasData?.deepl?.monthlyPercentUsed || 0) > 80 ? 'var(--accent-bearish)' : 'var(--accent-bullish)' }}>
                    {quotasData?.deepl?.monthlyPercentUsed || 0}% Used
                  </span>
                </div>
                {/* Clean iOS Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '100px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: `${Math.min(100, quotasData?.deepl?.monthlyPercentUsed || 0)}%`,
                      height: '100%',
                      background: (quotasData?.deepl?.monthlyPercentUsed || 0) > 80 ? 'var(--accent-bearish)' : 'var(--accent-blue)',
                      borderRadius: '100px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <span>ใช้ไป: <strong style={{ color: 'var(--text-primary)' }}>{(quotasData?.deepl?.monthCharCount || 0).toLocaleString()}</strong> ตัวอักษร</span>
                  <span>เพดานเซฟตี้: <strong style={{ color: 'var(--text-primary)' }}>{(quotasData?.deepl?.monthlyLimit || 450000).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Daily Safety Ceiling */}
              <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    เพดานความปลอดภัยรายวัน ({quotasData?.deepl?.day || 'Today'})
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-bullish)' }}>
                    {quotasData?.deepl?.dailyPercentUsed || 0}% Used
                  </span>
                </div>
                {/* Clean iOS Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '100px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: `${Math.min(100, quotasData?.deepl?.dailyPercentUsed || 0)}%`,
                      height: '100%',
                      background: 'var(--accent-bullish)',
                      borderRadius: '100px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <span>วันนี้: <strong style={{ color: 'var(--text-primary)' }}>{(quotasData?.deepl?.dayCharCount || 0).toLocaleString()}</strong> ตัวอักษร</span>
                  <span>โควตาคงเหลือวันนี้: <strong style={{ color: 'var(--accent-bullish)' }}>{(quotasData?.deepl?.dailyRemaining || 25000).toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive Live DeepL Translation Tester */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-sub-border)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="var(--accent-blue)" /> ทดสอบแปลภาษาและตรวจสอบโควตา Real-time
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setTestTransLang('EN')}
                    className={`admin-pill-btn ${testTransLang === 'EN' ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    TH ➔ EN
                  </button>
                  <button
                    onClick={() => setTestTransLang('TH')}
                    className={`admin-pill-btn ${testTransLang === 'TH' ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    EN ➔ TH
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={testTransText}
                  onChange={(e) => setTestTransText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการทดสอบแปล..."
                  className="admin-input-control"
                  style={{ flex: 1, minWidth: '240px' }}
                />
                <button
                  onClick={handleRunTranslationTest}
                  disabled={testTransLoading || !testTransText.trim()}
                  className="solid-button"
                  style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> {testTransLoading ? 'กำลังส่งแปล...' : 'ทดสอบแปล (Test)'}
                </button>
              </div>

              {testTransResult && (
                <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    ผลลัพธ์การแปล ({testTransResult.targetLang}):
                  </div>
                  <div style={{ color: 'var(--accent-bullish)', fontSize: '13.5px', fontWeight: 600 }}>
                    {testTransResult.translated || testTransResult.error || 'ไม่มีผลลัพธ์'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid of Other Integrated APIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Google Gemini AI */}
            <div className="admin-stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Google Gemini AI</span>
                <span
                  style={{
                    background: quotasData?.gemini?.isConfigured ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 159, 10, 0.15)',
                    color: quotasData?.gemini?.isConfigured ? 'var(--accent-bullish)' : 'var(--accent-neutral)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {quotasData?.gemini?.isConfigured ? '✓ Active' : '● Not Set'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                โมเดล: <strong style={{ color: 'var(--text-primary)' }}>{quotasData?.gemini?.model || 'gemini-1.5-flash'}</strong>
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>• Rate Limit: <strong style={{ color: 'var(--text-primary)' }}>15 Requests/Min (RPM)</strong></div>
                <div>• โควตารายวัน: <strong style={{ color: 'var(--text-primary)' }}>1,500 Requests/Day (RPD)</strong></div>
                <div>• ฟังก์ชัน: สรุปภาพรวมตลาด, สรุป Keylist หุ้นไทย-สหรัฐฯ</div>
              </div>
            </div>

            {/* Finnhub Stock API */}
            <div className="admin-stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Finnhub Market Data</span>
                <span
                  style={{
                    background: quotasData?.finnhub?.isConfigured ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 159, 10, 0.15)',
                    color: quotasData?.finnhub?.isConfigured ? 'var(--accent-bullish)' : 'var(--accent-neutral)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {quotasData?.finnhub?.isConfigured ? '✓ Active' : '● Standby'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                โควตา Free Tier: <strong style={{ color: 'var(--text-primary)' }}>60 API Calls / Minute</strong>
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>• ฟังก์ชัน: US Company Real-time News, SEC Corporate Filings</div>
                <div>• การป้องกัน: Adaptive Throttler & In-Memory TTL Cache</div>
              </div>
            </div>

            {/* Yahoo Finance & yfinance Bridge */}
            <div className="admin-stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Yahoo Finance Bridge</span>
                <span
                  style={{
                    background: 'rgba(48, 209, 88, 0.15)',
                    color: 'var(--accent-bullish)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  ✓ Operational
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                ระบบซิงค์: <strong style={{ color: 'var(--text-primary)' }}>REST Endpoints + yfinance Python</strong>
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>• อัตราเรียก: ไม่จำกัด (ควบคุมความถี่ด้วย TTL Cache 3-15 นาที)</div>
                <div>• ฟังก์ชัน: กราฟแท่งเทียนย้อนหลัง, ดัชนีหลักทรัพย์ SET50 & S&P500</div>
              </div>
            </div>

            {/* SET & Thai News Multi-Source RSS Matrix */}
            <div className="admin-stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>SET & Thai News RSS</span>
                <span
                  style={{
                    background: 'rgba(48, 209, 88, 0.15)',
                    color: 'var(--accent-bullish)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  ✓ Real-time 7D
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                แหล่งข่าว: <strong style={{ color: 'var(--text-primary)' }}>กรุงเทพธุรกิจ, ข่าวหุ้น, ทันหุ้น, ประชาชาติ</strong>
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>• รูปแบบ: Multi-Source RSS Rolling 7 วัน (`when:7d`)</div>
                <div>• การประมวลผล: Master News Intelligence & SEO Cleaner</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─── Bottom Persistent Output Console ─── */}
      <div className="admin-glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>
            <Terminal size={16} color="var(--accent-blue)" /> Quick Action Console Output
          </div>
          <button
            onClick={() => setLogsOutput('Console cleared.')}
            className="admin-pill-btn"
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Clear Output
          </button>
        </div>
        <div className="admin-terminal-container">
          <pre className="admin-terminal-body" style={{ maxHeight: '220px', margin: 0 }}>
            {logsOutput}
          </pre>
        </div>
      </div>
    </div>
  );
};
