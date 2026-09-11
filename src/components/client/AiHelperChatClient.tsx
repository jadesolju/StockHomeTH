'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import { ModelPickerPopup } from '@/components/client/ModelPickerPopup';
import { CURATED_MODELS, MODEL_FAMILIES, ModelSpec, DEFAULT_MODEL_ID } from '@/config/curated-models';
import { FAMILY_ICON_MAP } from '@/components/ui/ModelFamilyIcons';
import { Copy, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gemCoinsUsed?: number;
  modelUsed?: string;
  timestamp: string;
}

// SVG icons for quick prompts (no emoji)
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelSpec>(DEFAULT_MODEL);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const familyInfo = MODEL_FAMILIES.find((f) => f.key === selectedModel.family);

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

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputMessage).trim();
      if (!text || isLoading) return;

      if (totalGemCoinsAvailable <= 0) {
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

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            model: selectedModel.id,
            userTier: currentTier,
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

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: `ขออภัย: ${err.message || 'ไม่สามารถรับคำตอบได้ กรุณาลองใหม่อีกครั้ง'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, messages, totalGemCoinsAvailable, selectedModel, currentTier, deductGemCoins, openGemCoinModal]
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

  const clearChat = () => {
    if (window.confirm('คุณต้องการล้างประวัติการสนทนานี้หรือไม่?')) {
      setMessages([]);
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
        <div className="ai-chat-card">
          {/* ── Header Bar ── */}
          <header className="ai-header-bar">
            {/* Model Selector Button */}
            <div className="ai-model-select-box">
              <button
                id="model-picker-btn"
                onClick={() => setIsModelPickerOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${familyInfo?.color || '#38bdf8'}44`,
                  color: '#f1f5f9',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.borderColor = familyInfo?.color || '#38bdf8';
                  (e.currentTarget).style.background = `${familyInfo?.color || '#38bdf8'}14`;
                  (e.currentTarget).style.boxShadow = `0 0 14px ${familyInfo?.color || '#38bdf8'}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.borderColor = `${familyInfo?.color || '#38bdf8'}44`;
                  (e.currentTarget).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget).style.boxShadow = 'none';
                }}
                title="คลิกเพื่อเปลี่ยนโมเดล AI"
              >
                {/* SVG family icon — no emoji */}
                {(() => { const FIcon = familyInfo ? FAMILY_ICON_MAP[familyInfo.key] : null; return FIcon ? <FIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} /> : null; })()}
                <span>{selectedModel.name}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 6px',
                    borderRadius: '100px',
                    background: `${familyInfo?.color || '#38bdf8'}22`,
                    color: familyInfo?.color || '#38bdf8',
                    border: `1px solid ${familyInfo?.color || '#38bdf8'}30`,
                  }}
                >
                  {selectedModel.tag}
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  style={{ opacity: 0.6 }}
                >
                  <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {currentTier === 'free' && (
                <button
                  onClick={() => openGemCoinModal('plans')}
                  className="ai-model-tag-link"
                  style={{ border: 'none' }}
                >
                  ปลดล็อก Claude & GPT-4o
                </button>
              )}
            </div>

            {/* Right side: wallet + clear */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => openGemCoinModal('topup')}
                className="ai-gemcoin-wallet-pill"
                title="คลิกเพื่อดูกระเป๋า GemCoins"
              >
                <GemCoinIcon size={16} glow />
                <span>{totalGemCoinsAvailable.toLocaleString()}</span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>GemCoins</span>
                <span className="pill-add">+เติม</span>
              </button>

              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="ล้างการสนทนา"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {/* Trash SVG icon — no emoji */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {/* ── Chat Body ── */}
          <div className="ai-chat-body">
            {messages.length === 0 ? (
              /* ── Welcome / Empty State ── */
              <div className="ai-hero-welcome">
                <div className="ai-hero-badge-icon">
                  <GemCoinIcon size={38} glow />
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
              /* ── Message List ── */
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
                        <div className="ai-assistant-content">{msg.content}</div>
                      )}

                      {/* Footer: coins used + copy */}
                      {msg.role === 'assistant' && msg.gemCoinsUsed !== undefined && (
                        <div className="ai-bubble-footer">
                          <span className="ai-coins-used-tag">
                            <GemCoinIcon size={12} glow={false} />
                            ใช้ไป {msg.gemCoinsUsed} GemCoins
                          </span>
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

          {/* ── Input Bar ── */}
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
                {/* Send arrow SVG */}
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
                <strong style={{ color: '#34d399' }}>{dailyGemCoinsRemaining.toLocaleString()}</strong>
                {' '}/{' '}{dailyGemCoins.toLocaleString()} · Top-up ถาวร:{' '}
                <strong style={{ color: '#fbbf24' }}>{topupGemCoins.toLocaleString()}</strong>
              </span>
              <span style={{ display: 'none' }} className="sm-only">
                DYOR: ข้อมูลเพื่อการศึกษาเท่านั้น
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
