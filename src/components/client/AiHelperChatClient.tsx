'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { useClientAuth } from '@/lib/context/ClientAuthContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import { ModelPickerPopup } from '@/components/client/ModelPickerPopup';
import { CURATED_MODELS, MODEL_FAMILIES, ModelSpec, DEFAULT_MODEL_ID } from '@/config/curated-models';
import { FAMILY_ICON_MAP } from '@/components/ui/ModelFamilyIcons';
import { IosMarkdownRenderer } from '@/components/ui/IosMarkdownRenderer';
import {
  ChatSession,
  ChatMessage,
  loadUserSessions,
  createSession,
  updateSession,
  deleteSession,
  clearAllSessions,
} from '@/lib/services/aiChatHistoryService';
import { Copy, Check, History, ArrowLeft, Menu, X, Brain, Plus, Trash2, Zap } from 'lucide-react';
import Link from 'next/link';

// Pure SVG icons with currentColor (no emoji)
const ChartUpSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polyline points="3,17 8,12 13,15 21,7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17,7 21,7 21,11" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalculatorSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="#60a5fa" strokeWidth="1.8" />
    <line x1="8" y1="8" x2="16" y2="8" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="13" r="1" fill="#60a5fa" />
    <circle cx="12" cy="13" r="1" fill="#60a5fa" />
    <circle cx="16" cy="13" r="1" fill="#60a5fa" />
    <circle cx="8" cy="17" r="1" fill="#60a5fa" />
    <circle cx="12" cy="17" r="1" fill="#60a5fa" />
    <circle cx="16" cy="17" r="1" fill="#60a5fa" />
  </svg>
);

const NewsSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#f59e0b" strokeWidth="1.8" />
    <line x1="7" y1="9" x2="17" y2="9" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7" y1="13" x2="13" y2="13" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7" y1="16" x2="11" y2="16" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const HistoryClockSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlusIconSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SidebarToggleSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const TrashIconSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const QUICK_PROMPTS = [
  {
    Icon: ChartUpSvg,
    title: 'วิเคราะห์หุ้น DELTA',
    query:
      'DELTA ผลประกอบการและปัจจัยขับเคลื่อนหลักเป็นอย่างไร มีความเสี่ยงและจุดแข็งอะไรบ้าง?',
  },
  {
    Icon: CalculatorSvg,
    title: 'P/E vs P/BV คืออะไร?',
    query:
      'อธิบายความแตกต่างระหว่างค่า P/E Ratio และ P/BV Ratio แบบเข้าใจง่าย เหมาะกับหุ้นประเภทไหน?',
  },
  {
    Icon: NewsSvg,
    title: 'ภาพรวมตลาดหุ้นไทย',
    query:
      'สรุปปัจจัยสำคัญทั้งในและต่างประเทศที่มีผลต่อตลาดหุ้นไทย (SET) ในช่วงนี้?',
  },
];

// Default model — matched by DEFAULT_MODEL_ID from config
const DEFAULT_MODEL =
  CURATED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) || CURATED_MODELS[0];

function formatSessionDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export const AiHelperChatClient: React.FC = () => {
  const {
    currentTier,
    dailyGemCoinsRemaining,
    dailyGemCoins,
    topupGemCoins,
    totalGemCoinsAvailable,
    deductGemCoins,
    openGemCoinModal,
  } = useSubscription();

  const { user } = useClientAuth();
  const userUid = user?.uid || null;

  // History & Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [enableMemory, setEnableMemory] = useState(false); // Default OFF for budget-friendly mode

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelSpec>(DEFAULT_MODEL);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const familyInfo = MODEL_FAMILIES.find((f) => f.key === selectedModel.family);

  // Auto-detect mobile screen and close sidebar by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Load user sessions when user changes
  useEffect(() => {
    const loaded = loadUserSessions(userUid);
    setSessions(loaded);
  }, [userUid]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  };

  // Start a fresh New Chat
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInputMessage('');
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  // Select an existing session from history
  const handleSelectSession = useCallback((session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    const matchedModel = CURATED_MODELS.find((m) => m.id === session.modelId);
    if (matchedModel) setSelectedModel(matchedModel);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Delete a specific session
  const handleDeleteSession = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSession(userUid, id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [userUid, activeSessionId]);

  // Clear all sessions for this user
  const handleClearAll = useCallback(() => {
    if (window.confirm('คุณต้องการลบประวัติการสนทนาทั้งหมดของคุณใช่หรือไม่?')) {
      clearAllSessions(userUid);
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [userUid]);

  // Send message
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputMessage).trim();
      if (!text || isLoading) return;

      if (currentTier !== 'dev' && totalGemCoinsAvailable <= 0) {
        openGemCoinModal('topup');
        return;
      }

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setIsLoading(true);

      // Manage session persistence
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        const newSession = createSession(userUid, text, selectedModel.id, newMessages);
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
      } else {
        const updated = updateSession(userUid, currentSessionId, newMessages, selectedModel.id);
        setSessions(updated);
      }

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            model: selectedModel.id,
            userTier: currentTier,
            enableMemory,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI');
        }

        const coinsUsed = data.gemCoinsUsed || 8;
        deductGemCoins(coinsUsed, data.model || selectedModel.id, text.slice(0, 40));

        const aiMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          role: 'assistant',
          content: data.message,
          gemCoinsUsed: coinsUsed,
          modelUsed: data.model || selectedModel.id,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...newMessages, aiMsg];
        setMessages(finalMessages);

        // Update session with AI reply
        const updated = updateSession(userUid, currentSessionId, finalMessages, data.model || selectedModel.id);
        setSessions(updated);
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: `ขออภัย: ${err.message || 'ไม่สามารถรับคำตอบได้ กรุณาลองใหม่อีกครั้ง'}`,
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...newMessages, errorMsg];
        setMessages(finalMessages);
        const updated = updateSession(userUid, currentSessionId, finalMessages, selectedModel.id);
        setSessions(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, messages, totalGemCoinsAvailable, selectedModel, currentTier, deductGemCoins, openGemCoinModal, activeSessionId, userUid]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearCurrentChat = () => {
    if (window.confirm('คุณต้องการล้างข้อความในการสนทนานี้หรือไม่?')) {
      setMessages([]);
      if (activeSessionId) {
        const updated = updateSession(userUid, activeSessionId, []);
        setSessions(updated);
      }
    }
  };

  return (
    <>
      {/* Model Picker Popup */}
      <ModelPickerPopup
        isOpen={isModelPickerOpen}
        onClose={() => setIsModelPickerOpen(false)}
        onSelect={(model) => setSelectedModel(model)}
        selectedModelId={selectedModel.id}
        currentTier={currentTier}
      />

      {/* Main Chat Container */}
      <div className="ai-workspace-page">
        <div className="ai-chat-card with-sidebar">
          {/* Mobile Overlay for Sidebar */}
          {isSidebarOpen && (
            <div
              className="ai-sidebar-overlay"
              style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none' }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* ── Left Sidebar: Chat History ── */}
          {isSidebarOpen && (
            <aside className="ai-history-sidebar">
              {/* Sidebar Header */}
              <div className="ai-history-sidebar-header">
                <div className="ai-history-title-row">
                  <HistoryClockSvg />
                  <span>ประวัติการสนทนา</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="ai-sidebar-toggle-btn"
                  title="ย่อแถบข้าง"
                  style={{ width: '28px', height: '28px', border: 'none' }}
                >
                  ✕
                </button>
              </div>

              {/* New Chat Action Button */}
              <button onClick={handleNewChat} className="ai-new-chat-btn" title="เริ่มการสนทนาใหม่">
                <PlusIconSvg />
                <span>+ แชทใหม่ (New Chat)</span>
              </button>

              {/* AI Memory Context Control in Sidebar */}
              <div className="ai-sidebar-memory-widget">
                <div className="ai-sidebar-memory-header">
                  <div className="ai-sidebar-memory-title">
                    <Brain size={14} color="#38bdf8" />
                    <span>ความจำ (Memory)</span>
                  </div>
                  <button
                    onClick={() => setEnableMemory((prev) => !prev)}
                    className={`ios-toggle-switch small ${enableMemory ? 'on' : 'off'} ios-tappable`}
                    title={enableMemory ? 'คลิกเพื่อปิดโหมดความจำ (ประหยัดเหรียญ)' : 'คลิกเพื่อเปิดโหมดความจำ (จดจำบทสนทนา)'}
                    aria-label="เปิดปิดความจำบอท"
                  >
                    <div className="ios-toggle-knob" />
                  </button>
                </div>
                <div className="ai-sidebar-memory-status">
                  {enableMemory ? (
                    <span style={{ color: '#34d399' }}>● เปิดอยู่ (จำได้ถึง 100K Context)</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>○ ปิดอยู่ (โหมดประหยัดเหรียญ)</span>
                  )}
                </div>
              </div>

              {/* Sessions List */}
              <div className="ai-sessions-list">
                {sessions.length === 0 ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary, #64748b)' }}>
                    ยังไม่มีประวัติการสนทนา
                    <div style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.8 }}>
                      พิมพ์คำถามเพื่อเริ่มบันทึกอัตโนมัติ
                    </div>
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = activeSessionId === sess.id;
                    return (
                      <button
                        key={sess.id}
                        onClick={() => handleSelectSession(sess)}
                        className={`ai-session-item ${isActive ? 'active' : ''}`}
                        title={sess.title}
                      >
                        <span className="ai-session-title">{sess.title}</span>
                        <span className="ai-session-date">{formatSessionDate(sess.updatedAt)}</span>
                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="ai-session-del-btn"
                          title="ลบแชทนี้"
                        >
                          <TrashIconSvg />
                        </button>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="ai-sidebar-footer">
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  {user?.email ? (
                    <span title={user.email}>👤 {user.email.split('@')[0]}</span>
                  ) : (
                    <span>👤 โหมดผู้เยี่ยมชม</span>
                  )}
                </div>
                {sessions.length > 0 && (
                  <button onClick={handleClearAll} className="ai-clear-all-btn" title="ลบประวัติทั้งหมด">
                    ล้างทั้งหมด
                  </button>
                )}
              </div>
            </aside>
          )}

          {/* ── Main Chat Area ── */}
          <div className="ai-chat-main-area">
            {/* Header Bar - Clean 3-Column Mobile & Desktop Architecture */}
            <header className="ai-header-bar">
              {/* Left Column: iOS Back Navigation */}
              <div className="ai-header-left">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="ai-back-nav-btn ios-tappable"
                  title="ย้อนกลับ (Back)"
                  aria-label="ย้อนกลับ"
                >
                  <ArrowLeft size={18} strokeWidth={2.4} />
                  <span className="ai-back-text">กลับ</span>
                </button>
              </div>

              {/* Center Column: Model Selector Pill */}
              <div className="ai-header-center">
                <button
                  id="model-picker-btn"
                  onClick={() => setIsModelPickerOpen(true)}
                  className="ai-model-picker-btn ios-tappable"
                  style={{
                    border: `1px solid ${familyInfo?.color || '#007aff'}44`,
                  }}
                  title="คลิกเพื่อเปลี่ยนโมเดล AI"
                >
                  {/* SVG family icon */}
                  {(() => {
                    const FIcon = familyInfo ? FAMILY_ICON_MAP[familyInfo.key] : null;
                    return FIcon ? <FIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} /> : null;
                  })()}
                  <span className="ai-model-name-text">
                    {selectedModel.name}
                  </span>
                  <span className="ai-model-tag-badge">
                    {selectedModel.tag}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{ color: 'var(--text-primary, #000000)' }}
                  >
                    <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Right Column: Desktop Action Controls & Mobile Hamburger Button */}
              <div className="ai-header-right">
                {/* Desktop-only Action Bar (Hidden on Mobile) */}
                <div className="ai-desktop-actions">
                  <button
                    onClick={() => setEnableMemory((prev) => !prev)}
                    className={`ai-memory-pill-btn ios-tappable ${enableMemory ? 'active' : ''}`}
                    title={enableMemory ? 'ความจำบอท: เปิด (จำบทสนทนาต่อเนื่อง)' : 'ความจำบอท: ปิด (โหมดประหยัดเหรียญ)'}
                  >
                    <Brain size={14} />
                    <span>{enableMemory ? 'ความจำ: เปิด' : 'ความจำ: ปิด'}</span>
                  </button>

                  <button
                    onClick={() => openGemCoinModal('logs')}
                    className="ai-history-log-btn ios-tappable"
                    title="ดูประวัติการใช้งาน GemCoins ทั้งหมดแบบโปร่งใส"
                  >
                    <History size={14} />
                    <span className="ai-history-btn-text">ประวัติเหรียญ</span>
                  </button>

                  <button
                    onClick={() => openGemCoinModal('topup')}
                    className="ai-gemcoin-wallet-pill ios-tappable"
                    title="คลิกเพื่อจัดการกระเป๋าเหรียญ เติม GemCoins และดูประวัติ"
                  >
                    <GemCoinIcon size={16} glow />
                    <span>{totalGemCoinsAvailable.toLocaleString()}</span>
                    <span className="ai-wallet-label">GemCoins</span>
                    <span className="pill-add">+เติม</span>
                  </button>

                  <button
                    onClick={handleNewChat}
                    className="ai-header-new-chat-btn ios-tappable"
                    title="เริ่มแชทใหม่"
                  >
                    <PlusIconSvg />
                  </button>
                </div>

                {/* Mobile Hamburger Menu Button (Takes zero space, stops header overlap!) */}
                <button
                  onClick={() => setIsHamburgerOpen((prev) => !prev)}
                  className="ai-hamburger-btn ios-tappable"
                  aria-label="เปิดเมนูการจัดการ AI"
                  title="เมนูตั้งค่าและกระเป๋าเหรียญ"
                >
                  <Menu size={20} strokeWidth={2.2} />
                </button>
              </div>
            </header>

            {/* ── Mobile Hamburger Drawer / Action Sheet ── */}
            {isHamburgerOpen && (
              <div
                className="ai-hamburger-overlay"
                onClick={() => setIsHamburgerOpen(false)}
              >
                <div
                  className="ai-hamburger-sheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sheet Header */}
                  <div className="ai-sheet-header">
                    <div className="ai-sheet-title">
                      <span>เมนู AI Agent</span>
                    </div>
                    <button
                      onClick={() => setIsHamburgerOpen(false)}
                      className="ai-sheet-close-btn ios-tappable"
                      aria-label="ปิดเมนู"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Sheet Content */}
                  <div className="ai-sheet-body">
                    {/* 1. Wallet & GemCoins Card */}
                    <div className="ai-sheet-wallet-card">
                      <div className="ai-sheet-wallet-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <GemCoinIcon size={22} glow />
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ยอด GemCoins ของคุณ</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                              {totalGemCoinsAvailable.toLocaleString()}{' '}
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Coins</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsHamburgerOpen(false);
                            openGemCoinModal('topup');
                          }}
                          className="ai-sheet-topup-btn ios-tappable"
                        >
                          + เติมเหรียญ
                        </button>
                      </div>

                      <div className="ai-sheet-wallet-breakdown">
                        <div>
                          <span>โควตาฟรีวันนี้: </span>
                          <strong style={{ color: '#34d399' }}>{dailyGemCoinsRemaining.toLocaleString()}</strong> / {dailyGemCoins.toLocaleString()}
                        </div>
                        <div>
                          <span>Top-up ถาวร: </span>
                          <strong style={{ color: '#fbbf24' }}>{topupGemCoins.toLocaleString()}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsHamburgerOpen(false);
                          openGemCoinModal('logs');
                        }}
                        className="ai-sheet-log-btn ios-tappable"
                      >
                        <History size={14} />
                        <span>ดูประวัติการใช้งาน GemCoins ทั้งหมด</span>
                      </button>
                    </div>

                    {/* 2. AI Memory & Context Toggle Switch */}
                    <div className="ai-sheet-setting-row">
                      <div className="ai-setting-info">
                        <div className="ai-setting-label">
                          <Brain size={16} color="#38bdf8" />
                          <span>ความจำบทสนทนา (Memory)</span>
                        </div>
                        <div className="ai-setting-desc">
                          {enableMemory
                            ? 'เปิดใช้งาน: บอทจดจำประวัติการคุยต่อเนื่องได้สูงสุด 100K Context (เกิน 8 ข้อความคิดตามโทเคนจริง)'
                            : 'ปิดอยู่ (ประหยัดเหรียญ): ตอบทีละคำถาม ไม่คิด GemCoins เพิ่มเติม (Default)'}
                        </div>
                      </div>
                      <button
                        onClick={() => setEnableMemory((prev) => !prev)}
                        className={`ios-toggle-switch ${enableMemory ? 'on' : 'off'} ios-tappable`}
                        aria-label="สลับความจำบอท"
                      >
                        <div className="ios-toggle-knob" />
                      </button>
                    </div>

                    {/* 3. Chat Actions */}
                    <div className="ai-sheet-actions-group">
                      <button
                        onClick={() => {
                          setIsHamburgerOpen(false);
                          handleNewChat();
                        }}
                        className="ai-sheet-action-item ios-tappable"
                      >
                        <Plus size={16} color="#38bdf8" />
                        <span>เริ่มการสนทนาใหม่ (New Chat)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsHamburgerOpen(false);
                          setIsSidebarOpen(true);
                        }}
                        className="ai-sheet-action-item ios-tappable"
                      >
                        <History size={16} color="#818cf8" />
                        <span>ประวัติการสนทนาย้อนหลัง ({sessions.length} แชท)</span>
                      </button>

                      {messages.length > 0 && (
                        <button
                          onClick={() => {
                            setIsHamburgerOpen(false);
                            clearCurrentChat();
                          }}
                          className="ai-sheet-action-item danger ios-tappable"
                        >
                          <Trash2 size={16} color="#ef4444" />
                          <span>ล้างข้อความในหน้านี้ (Clear Chat)</span>
                        </button>
                      )}
                    </div>

                    {/* 4. Tier Info & Upgrade */}
                    <div className="ai-sheet-tier-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                        <Zap size={14} color="#f59e0b" />
                        <span>สถานะสิทธิ์ปัจจุบัน: <strong style={{ color: '#ffffff', textTransform: 'uppercase' }}>{currentTier}</strong></span>
                      </div>
                      {currentTier === 'free' && (
                        <Link
                          href="/payments"
                          onClick={() => setIsHamburgerOpen(false)}
                          className="ai-sheet-upgrade-link ios-tappable"
                        >
                          อัปเกรดเพื่อปลดล็อกโมเดลทั้งหมด →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Body */}
            <div className="ai-chat-body">
              {messages.length === 0 ? (
                /* Welcome / Empty State */
                <div className="ai-hero-welcome">
                  <div className="ai-hero-badge-icon">
                    <GemCoinIcon size={26} glow />
                  </div>
                  <h1 className="ai-hero-title">StockHome AI</h1>
                  <p className="ai-hero-subtitle">
                    ผู้ช่วยปัญญาประดิษฐ์ด้านการเงินและหุ้นไทย (SET/mai)
                    สรุปงบ คำนวณ P/E และวิเคราะห์ข่าวการลงทุนด้วย AI ชั้นนำระดับโลก
                  </p>

                  <div className="ai-quick-prompts-grid">
                    {QUICK_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        className="ai-quick-prompt-btn"
                        onClick={() => handleSend(item.query)}
                      >
                        <div className="ai-quick-prompt-icon">
                          <item.Icon />
                        </div>
                        <div>
                          <div className="ai-quick-prompt-title">{item.title}</div>
                          <div className="ai-quick-prompt-desc">{item.query}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message List */
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`ai-msg-row ${msg.role}`}
                    >
                      {/* AI avatar */}
                      {msg.role === 'assistant' && (
                        <div className="ai-avatar-badge">
                          <GemCoinIcon size={20} glow />
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`ai-bubble ${msg.role}`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="ai-assistant-content">
                            <IosMarkdownRenderer content={msg.content} />
                          </div>
                        )}

                        {/* Footer: coins used + copy */}
                        {msg.role === 'assistant' && msg.gemCoinsUsed !== undefined && (
                          <div className="ai-bubble-footer">
                            <button
                              onClick={() => openGemCoinModal('logs')}
                              className="ai-coins-used-tag ios-tappable"
                              title="คลิกเพื่อดูประวัติการใช้งาน GemCoins ทั้งหมดแบบโปร่งใส"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <GemCoinIcon size={12} glow={false} />
                              <span>ใช้ไป {msg.gemCoinsUsed} GemCoins</span>
                              <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: '3px' }}>↗</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              className="ai-copy-btn"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                  คัดลอกแล้ว
                                </>
                              ) : (
                                <>
                                  <Copy size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                  คัดลอก
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* User avatar */}
                      {msg.role === 'user' && (
                        <div className="ai-avatar-badge user-avatar">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="12" cy="8" r="4" fill="#60a5fa" />
                            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="ai-msg-row assistant">
                      <div className="ai-avatar-badge">
                        <GemCoinIcon size={20} glow />
                      </div>
                      <div className="ai-bubble assistant" style={{ padding: '12px 16px' }}>
                        <div className="ai-typing-indicator">
                          <div className="ai-typing-dot" />
                          <div className="ai-typing-dot" />
                          <div className="ai-typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="ai-input-container">
              <div className="ai-input-box">
                <textarea
                  ref={textareaRef}
                  className="ai-input-textarea"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    handleTextareaInput();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="ถามเกี่ยวกับหุ้น ข่าวการเงิน หรือกลยุทธ์การลงทุน... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
                  rows={1}
                />
                <button
                  className="ai-send-action-btn"
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim() || isLoading}
                  title="ส่งข้อความ"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Subtext bar */}
              <div className="ai-input-subtext">
                <span>
                  โควตาฟรีวันนี้:{' '}
                  <strong className="ai-quota-daily">{dailyGemCoinsRemaining.toLocaleString()}</strong>
                  {' '}/{' '}{dailyGemCoins.toLocaleString()} · Top-up ถาวร:{' '}
                  <strong className="ai-quota-topup">{topupGemCoins.toLocaleString()}</strong>
                </span>
                <span style={{ display: 'none' }} className="sm-only">
                  DYOR: ข้อมูลเพื่อการศึกษาเท่านั้น
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
