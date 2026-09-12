'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { useClientAuth } from '@/lib/context/ClientAuthContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import { ModelPickerPopup } from '@/components/client/ModelPickerPopup';
import { CURATED_MODELS, MODEL_FAMILIES, ModelSpec, DEFAULT_MODEL_ID, getModelGemCoinsEst } from '@/config/curated-models';
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
  subscribeToUserCloudSessions,
} from '@/lib/services/aiChatHistoryService';
import {
  Copy,
  Check,
  History,
  ArrowLeft,
  Menu,
  X,
  Brain,
  Plus,
  Trash2,
  Zap,
  Settings,
  Edit2,
  RotateCcw,
  Square,
  Paperclip,
  AlertTriangle,
  ChevronDown,
  Lock,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';
import {
  compressImageTo1024,
  scanDocumentFile,
  ProcessedImage,
  ProcessedDocument,
} from '@/lib/utils/clientMediaHelper';

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

// Quick prompt suggestions
const QUICK_PROMPTS = [
  {
    Icon: ChartUpSvg,
    title: 'วิเคราะห์หุ้นเด่นวันนี้',
    query: 'วิเคราะห์แนวโน้มหุ้นไทยเด่น 3 ตัวที่น่าจับตามองในสัปดาห์นี้ พร้อมแนวรับแนวต้าน',
  },
  {
    Icon: CalculatorSvg,
    title: 'คำนวณ P/E & ปันผล',
    query: 'สอนวิธีดู P/E Ratio และ Dividend Yield เพื่อคัดหุ้นปันผลดี ไม่ติดดอย',
  },
  {
    Icon: NewsSvg,
    title: 'สรุปประเด็นข่าวตลาด',
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
    refundGemCoins,
    openGemCoinModal,
    isOwnerAccount,
    isGuest,
  } = useSubscription();

  const { user, openAuthModal } = useClientAuth();
  const userUid = user?.uid || null;

  // History & Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [enableMemory, setEnableMemory] = useState(true); // Default ON for smart rolling context memory
  const [summaryModalText, setSummaryModalText] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelSpec>(DEFAULT_MODEL);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multimodal State
  const [attachedImages, setAttachedImages] = useState<ProcessedImage[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<ProcessedDocument[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Message Edit State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');

  // System Notice Dialog
  const [systemNotice, setSystemNotice] = useState<string | null>(null);

  // Abort Controller & Cost tracker
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentCallEstCoinsRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const familyInfo = MODEL_FAMILIES.find((f) => f.key === selectedModel.family);

  // Auto-detect mobile screen and close sidebar by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Load user sessions when user changes & establish realtime Cloud Sync
  useEffect(() => {
    const loaded = loadUserSessions(userUid);
    setSessions(loaded);

    if (userUid) {
      const unsubscribe = subscribeToUserCloudSessions(userUid, (cloudSessions) => {
        setSessions(cloudSessions);
      });
      return () => unsubscribe();
    }
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

  // File input change handler (Client-side compression 1024px & token counter)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageTo1024(file);
          setAttachedImages((prev) => [...prev.slice(-3), compressed]); // cap at 4 images
        } else {
          const doc = await scanDocumentFile(file);
          if (doc.exceedsFreeQuota && currentTier === 'free') {
            setSystemNotice(
              'ไฟล์เอกสารของคุณใหญ่เกินโควตาสายฟรี โปรดเลือกเฉพาะหน้าสรุปงบการเงิน หรือสมัครแพลน Subscription เพื่อวิเคราะห์ไฟล์ไม่จำกัดขนาด'
            );
            continue;
          }
          setAttachedDocs((prev) => [...prev.slice(-1), doc]); // cap at 2 docs
        }
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Abort ongoing generation
  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (currentCallEstCoinsRef.current > 0) {
      refundGemCoins(currentCallEstCoinsRef.current, 'ยกเลิกคำขอ');
      currentCallEstCoinsRef.current = 0;
    }
    setIsLoading(false);

    const cancelNotice: ChatMessage = {
      id: 'msg_abort_' + Date.now(),
      role: 'assistant',
      content: '**[SYSTEM NOTICE]** ยกเลิกคำขอสำเร็จ ระบบไม่ได้หัก Gemcoin ของคุณในรอบนี้',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, cancelNotice];
      if (activeSessionId) {
        updateSession(userUid, activeSessionId, updated, selectedModel.id);
      }
      return updated;
    });
  }, [refundGemCoins, activeSessionId, userUid, selectedModel.id]);

  // Send message
  const handleSend = useCallback(
    async (textToSend?: string, customHistory?: ChatMessage[]) => {
      // 0. Mandatory Login Guard for Guest
      if (!user && !isOwnerAccount) {
        openAuthModal('login');
        return;
      }

      const text = (textToSend !== undefined ? textToSend : inputMessage).trim();
      if (!text || isLoading) return;

      const visionCost = attachedImages.length * 25;
      const estCoins = getModelGemCoinsEst(selectedModel) + visionCost;

      if (currentTier !== 'dev' && totalGemCoinsAvailable < estCoins && totalGemCoinsAvailable <= 0) {
        openGemCoinModal('topup');
        return;
      }

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      const baseHistory = customHistory || messages;
      const newMessages = [...baseHistory, userMsg];
      setMessages(newMessages);
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setIsLoading(true);

      const imagesToSend = [...attachedImages];
      const docsToSend = [...attachedDocs];
      setAttachedImages([]);
      setAttachedDocs([]);

      // Manage session persistence
      let currentSessionId = activeSessionId;
      const activeSessionObj = sessions.find((s) => s.id === currentSessionId);
      const sessionContextSummary = activeSessionObj?.contextSummary;
      const sessionSummarizedUpToIndex = activeSessionObj?.summarizedUpToIndex;

      if (!currentSessionId) {
        const newSession = createSession(userUid, text, selectedModel.id, newMessages, sessionContextSummary, sessionSummarizedUpToIndex);
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
      } else {
        const updated = updateSession(userUid, currentSessionId, newMessages, selectedModel.id);
        setSessions(updated);
      }

      // Initialize AbortController
      abortControllerRef.current = new AbortController();
      currentCallEstCoinsRef.current = estCoins;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            model: selectedModel.id,
            userTier: currentTier,
            userId: userUid,
            userEmail: user?.email,
            enableMemory,
            contextSummary: sessionContextSummary,
            summarizedUpToIndex: sessionSummarizedUpToIndex,
            stream: true,
            images: imagesToSend.map((img) => img.dataUrl),
            documentText: docsToSend.map((d) => d.text).join('\n\n'),
            documentName: docsToSend.map((d) => d.name).join(', '),
          }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.isOversizedDoc) {
            setSystemNotice(errData.error);
          }
          throw new Error(errData.error || `เกิดข้อผิดพลาดในการเชื่อมต่อ AI (${res.status})`);
        }

        // Handle Real-Time SSE Streaming
        if (contentType.includes('text/event-stream') && res.body) {
          const aiMsgId = 'msg_ai_' + Date.now();
          let streamedContent = '';
          let finalModel = selectedModel.id;
          let finalCoins = estCoins;
          let finalTruncated = false;
          let finalSummary = sessionContextSummary;
          let finalSummaryIdx = sessionSummarizedUpToIndex || 0;

          // Placeholder assistant message for typewriter typing effect
          const placeholderAiMsg: ChatMessage = {
            id: aiMsgId,
            role: 'assistant',
            content: '',
            gemCoinsUsed: estCoins,
            modelUsed: selectedModel.id,
            isTruncated: false,
            timestamp: new Date().toISOString(),
          };
          setMessages([...newMessages, placeholderAiMsg]);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === 'chunk' && parsed.delta) {
                  streamedContent += parsed.delta;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, content: streamedContent } : m))
                  );
                } else if (parsed.type === 'meta') {
                  if (parsed.model) finalModel = parsed.model;
                  if (parsed.gemCoinsUsed !== undefined) finalCoins = parsed.gemCoinsUsed;
                  if (parsed.isTruncated !== undefined) finalTruncated = Boolean(parsed.isTruncated);
                  if (parsed.contextSummary) finalSummary = parsed.contextSummary;
                  if (parsed.summarizedUpToIndex !== undefined) finalSummaryIdx = parsed.summarizedUpToIndex;
                }
              } catch {
                // Ignore incomplete JSON stream fragments
              }
            }
          }

          // Deduct coins and update completed message
          deductGemCoins(finalCoins, finalModel, text.slice(0, 40));

          const completedAiMsg: ChatMessage = {
            id: aiMsgId,
            role: 'assistant',
            content: streamedContent || 'ขออภัย ไม่ได้รับคำตอบจากระบบ กรุณาลองใหม่อีกครั้ง',
            gemCoinsUsed: finalCoins,
            modelUsed: finalModel,
            isTruncated: finalTruncated,
            timestamp: new Date().toISOString(),
          };

          const finalMessages = [...newMessages, completedAiMsg];
          setMessages(finalMessages);

          const updated = updateSession(
            userUid,
            currentSessionId,
            finalMessages,
            finalModel,
            undefined,
            finalSummary,
            finalSummaryIdx
          );
          setSessions(updated);
        } else {
          // Standard JSON fallback
          const data = await res.json();
          const coinsUsed = data.gemCoinsUsed || estCoins;
          deductGemCoins(coinsUsed, data.model || selectedModel.id, text.slice(0, 40));

          const aiMsg: ChatMessage = {
            id: 'msg_ai_' + Date.now(),
            role: 'assistant',
            content: data.message,
            gemCoinsUsed: coinsUsed,
            modelUsed: data.model || selectedModel.id,
            isTruncated: Boolean(data.isTruncated),
            timestamp: new Date().toISOString(),
          };

          const finalMessages = [...newMessages, aiMsg];
          setMessages(finalMessages);

          const updated = updateSession(
            userUid,
            currentSessionId,
            finalMessages,
            data.model || selectedModel.id,
            undefined,
            data.contextSummary || sessionContextSummary,
            data.summarizedUpToIndex ?? sessionSummarizedUpToIndex
          );
          setSessions(updated);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // Already handled by handleAbort
        }
        refundGemCoins(estCoins, 'ระบบล่ม / เกิดข้อผิดพลาด');
        const errorMsg: ChatMessage = {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: `**[SYSTEM NOTICE]** เกิดข้อผิดพลาดในการเชื่อมต่อโมเดลวิเคราะห์หุ้น ระบบทำการคืนเงินจำนวน **${estCoins}** Gemcoin กลับเข้าสู่บัญชีของคุณเรียบร้อยแล้ว โปรดลองใหม่อีกครั้ง`,
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...newMessages, errorMsg];
        setMessages(finalMessages);
        const updated = updateSession(userUid, currentSessionId, finalMessages, selectedModel.id);
        setSessions(updated);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        currentCallEstCoinsRef.current = 0;
      }
    },
    [inputMessage, isLoading, messages, totalGemCoinsAvailable, selectedModel, currentTier, deductGemCoins, refundGemCoins, openGemCoinModal, activeSessionId, userUid, enableMemory, attachedImages, attachedDocs, sessions]
  );

  // Regenerate last AI response
  const handleRegenerate = useCallback(
    (msgId?: string) => {
      if (isLoading) return;
      const targetIndex = msgId
        ? messages.findIndex((m) => m.id === msgId)
        : messages.length - 1;

      if (targetIndex < 0) return;

      let userMsgText = '';
      for (let i = targetIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMsgText = messages[i].content;
          break;
        }
      }

      if (!userMsgText) return;

      const trimmedMessages = messages.slice(0, targetIndex);
      setMessages(trimmedMessages);
      handleSend(userMsgText, trimmedMessages);
    },
    [isLoading, messages, handleSend]
  );

  // Edit message handlers
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditInputText(msg.content);
  };

  const handleSaveEdit = (targetId: string) => {
    const text = editInputText.trim();
    if (!text) return;
    const index = messages.findIndex((m) => m.id === targetId);
    if (index < 0) return;

    const beforeMessages = messages.slice(0, index);
    setEditingMsgId(null);
    setEditInputText('');
    handleSend(text, beforeMessages);
  };

  // Continue generating truncated answer
  const handleContinue = useCallback(() => {
    if (isLoading) return;
    handleSend('เขียนต่อจากส่วนที่ค้างไว้ให้จบสมบูรณ์อย่างละเอียดทุกประเด็น');
  }, [isLoading, handleSend]);

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
                    <span>ความจำ (Rolling Memory)</span>
                  </div>
                  <button
                    onClick={() => setEnableMemory((prev) => !prev)}
                    className={`ios-toggle-switch small ${enableMemory ? 'on' : 'off'} ios-tappable`}
                    title={enableMemory ? 'คลิกเพื่อปิดโหมดความจำ (คำถามเดี่ยว)' : 'คลิกเพื่อเปิดโหมดความจำ (จดจำต่อเนื่อง)'}
                    aria-label="เปิดปิดความจำบอท"
                  >
                    <div className="ios-toggle-knob" />
                  </button>
                </div>
                <div className="ai-sidebar-memory-status">
                  {enableMemory ? (
                    <span style={{ color: '#34d399' }}>● สรุปประวัติอัตโนมัติ (ไม่ลืม & ประหยัด Token)</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>○ ปิดอยู่ (โหมดคำถามเดี่ยว)</span>
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
              {/* Left Column: iOS Back Navigation + Hamburger Sidebar Toggle + New Chat */}
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
                  <ArrowLeft size={17} strokeWidth={2.4} />
                  <span className="ai-back-text">กลับ</span>
                </button>

                {/* Hamburger Toggle Button for History Sidebar (Desktop & Mobile) */}
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className={`ai-sidebar-hamburger-btn ios-tappable ${isSidebarOpen ? 'active' : ''}`}
                  title={isSidebarOpen ? 'ซ่อนแถบประวัติ' : 'เปิดประวัติการสนทนา'}
                  aria-label="ประวัติการสนทนา"
                >
                  <Menu size={18} strokeWidth={2.2} />
                </button>

                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="ai-header-new-chat-btn ios-tappable"
                  title="เริ่มแชทใหม่ (New Chat)"
                >
                  <PlusIconSvg />
                </button>
              </div>

              {/* Center Column: Model Selector Pill & Context Summary Badge */}
              <div className="ai-header-center" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mobile Title with Subtle Model Hint (Mobile Only) */}
                <div className="ai-mobile-header-center-box">
                  <span className="ai-mobile-header-title">StockHome AI</span>
                  <button
                    type="button"
                    onClick={() => setIsModelPickerOpen(true)}
                    className="ai-mobile-model-hint ios-tappable"
                    title="แตะเพื่อดูหรือเปลี่ยนโมเดล AI"
                  >
                    <span>⚡ {selectedModel.name}</span>
                    <ChevronDown size={10} />
                  </button>
                </div>

                {/* Desktop Model Selector Pill (Name Only, No Duplicate Tag) */}
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

                {/* Active Session Context Summary Pill */}
                {(() => {
                  const currSess = sessions.find((s) => s.id === activeSessionId);
                  if (!currSess?.contextSummary) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => setSummaryModalText(currSess.contextSummary || null)}
                      className="ai-summary-header-badge ios-tappable"
                      title="คลิกเพื่อดูสิ่งที่ AI บันทึกสรุปไว้ในห้องสนทนานี้"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Brain size={12} color="#38bdf8" />
                      <span className="ai-summary-badge-text">จำบริบทแล้ว</span>
                    </button>
                  );
                })()}
              </div>

              {/* Right Column: Wallet Pill + Tier Badge + Settings Action Menu */}
              <div className="ai-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => openGemCoinModal('topup')}
                  className="ai-gemcoin-wallet-pill ios-tappable"
                  title="คลิกเพื่อจัดการกระเป๋าเหรียญ เติม GemCoins และดูประวัติ"
                >
                  <GemCoinIcon size={16} glow />
                  <span>{totalGemCoinsAvailable.toLocaleString()}</span>
                  <span className="pill-add">+เติม</span>
                </button>

                {/* User Tier Badge */}
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background:
                      currentTier === 'whale'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : currentTier === 'vip'
                        ? 'rgba(168, 85, 247, 0.15)'
                        : currentTier === 'pro'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : currentTier === 'dev'
                        ? 'rgba(236, 72, 153, 0.15)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color:
                      currentTier === 'whale'
                        ? '#06b6d4'
                        : currentTier === 'vip'
                        ? '#c084fc'
                        : currentTier === 'pro'
                        ? '#60a5fa'
                        : currentTier === 'dev'
                        ? '#f472b6'
                        : '#94a3b8',
                    border: `1px solid ${
                      currentTier === 'whale'
                        ? 'rgba(6, 182, 212, 0.3)'
                        : currentTier === 'vip'
                        ? 'rgba(168, 85, 247, 0.3)'
                        : currentTier === 'pro'
                        ? 'rgba(59, 130, 246, 0.3)'
                        : currentTier === 'dev'
                        ? 'rgba(236, 72, 153, 0.3)'
                        : 'rgba(255, 255, 255, 0.12)'
                    }`,
                  }}
                >
                  {currentTier === 'whale'
                    ? '🐋 WHALE'
                    : currentTier === 'vip'
                    ? '👑 VIP'
                    : currentTier === 'pro'
                    ? '💎 PRO'
                    : currentTier === 'lite'
                    ? '☕ LITE'
                    : currentTier === 'dev'
                    ? '🛠️ DEV'
                    : '🥉 FREE'}
                </div>

                {/* Settings / Actions Hamburger Menu Button */}
                <button
                  onClick={() => setIsHamburgerOpen((prev) => !prev)}
                  className="ai-actions-menu-btn ios-tappable"
                  aria-label="เปิดเมนูตั้งค่าและกระเป๋าเหรียญ"
                  title="เมนูตั้งค่าความจำ & เหรียญ"
                >
                  <Settings size={18} strokeWidth={2.2} />
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
                    {/* 0. Active AI Model Card */}
                    <div className="ai-sheet-model-card">
                      <div className="ai-sheet-model-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(() => {
                            const FIcon = familyInfo ? FAMILY_ICON_MAP[familyInfo.key] : null;
                            return FIcon ? <FIcon style={{ width: '22px', height: '22px', flexShrink: 0 }} /> : <Zap size={20} color="#38bdf8" />;
                          })()}
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #94a3b8)' }}>โมเดล AI ที่ใช้งานอยู่</div>
                            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                              {selectedModel.name}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsHamburgerOpen(false);
                            setIsModelPickerOpen(true);
                          }}
                          className="ai-sheet-change-model-btn ios-tappable"
                        >
                          เปลี่ยนโมเดล →
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px', lineHeight: 1.4 }}>
                        {selectedModel.highlight}
                      </div>
                    </div>

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
                          editingMsgId === msg.id ? (
                            <div className="ai-msg-edit-box">
                              <textarea
                                className="ai-msg-edit-textarea"
                                value={editInputText}
                                onChange={(e) => setEditInputText(e.target.value)}
                                autoFocus
                              />
                              <div className="ai-msg-edit-actions">
                                <button
                                  type="button"
                                  className="ai-msg-edit-cancel-btn"
                                  onClick={() => setEditingMsgId(null)}
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  className="ai-msg-edit-save-btn"
                                  onClick={() => handleSaveEdit(msg.id)}
                                >
                                  บันทึกและส่งใหม่
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>{msg.content}</div>
                              <div className="ai-bubble-actions">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="ai-action-icon-btn"
                                  title="แก้ไขข้อความนี้"
                                >
                                  <Edit2 size={11} />
                                  <span>แก้ไข</span>
                                </button>
                              </div>
                            </>
                          )
                        ) : (
                          <div className="ai-assistant-content">
                            <IosMarkdownRenderer content={msg.content} />
                            {msg.isTruncated && (
                              <div>
                                <button
                                  type="button"
                                  onClick={handleContinue}
                                  className="ai-continue-btn"
                                  title="ข้อความยาว คลิกเพื่อให้ AI เขียนต่อจากจุดเดิม"
                                  disabled={isLoading}
                                >
                                  <span>⏩ ตอบต่อ (Continue)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer: coins used + copy + regenerate */}
                        {msg.role === 'assistant' && (
                          <div className="ai-bubble-footer">
                            {msg.gemCoinsUsed !== undefined && (
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
                            )}

                            <button
                              type="button"
                              onClick={() => handleRegenerate(msg.id)}
                              className="ai-action-icon-btn"
                              title="สุ่มคำตอบใหม่ (Regenerate)"
                              disabled={isLoading}
                            >
                              <RotateCcw size={11} />
                              <span>ตอบใหม่</span>
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
              {/* Attachment Preview Bar */}
              {(attachedImages.length > 0 || attachedDocs.length > 0) && (
                <div className="ai-attachment-preview-bar">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="ai-attach-chip">
                      <img src={img.dataUrl} alt={img.name} />
                      <span>{img.name.slice(0, 15)} ({img.sizeKb}KB)</span>
                      <button
                        type="button"
                        className="ai-chip-remove"
                        onClick={() => setAttachedImages((prev) => prev.filter((i) => i.id !== img.id))}
                        title="ลบรูปภาพนี้"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {attachedDocs.map((doc) => (
                    <div key={doc.id} className="ai-attach-chip">
                      <span>📄 {doc.name.slice(0, 15)} (~{doc.estimatedTokens.toLocaleString()} tokens)</span>
                      <button
                        type="button"
                        className="ai-chip-remove"
                        onClick={() => setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                        title="ลบเอกสารนี้"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Guest Login Requirement Banner */}
              {(!user && !isOwnerAccount) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 16px',
                    marginBottom: '10px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '6px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                      <Lock size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                        เข้าสู่ระบบเพื่อใช้งาน AI Agent & รับฟรี 500 GemCoins ทุกวัน
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                        สมาชิกทั่วไปปลดล็อกการวิเคราะห์หุ้นได้ฟรี ปลอดภัย รวดเร็ว
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="ios-btn-primary"
                    style={{
                      padding: '7px 15px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <LogIn size={13} /> เข้าสู่ระบบ
                  </button>
                </div>
              )}

              <div className="ai-input-box">
                {/* Hidden Multi-file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.csv,.json,.txt"
                  multiple
                  style={{ display: 'none' }}
                />

                {/* Multimodal ➕ Attachment Button */}
                <button
                  type="button"
                  className="ai-attach-btn"
                  onClick={() => {
                    if (!user && !isOwnerAccount) {
                      openAuthModal('login');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  title="แนบรูปภาพกราฟงบ หรือเอกสาร (ย่อเหลือ 1024px อัตโนมัติ +25 GemCoins/รูป)"
                  disabled={isLoading || isUploadingMedia}
                >
                  <Plus size={18} />
                </button>

                <textarea
                  ref={textareaRef}
                  className="ai-input-textarea"
                  value={inputMessage}
                  onChange={(e) => {
                    if (!user && !isOwnerAccount) {
                      openAuthModal('login');
                      return;
                    }
                    setInputMessage(e.target.value);
                    handleTextareaInput();
                  }}
                  onKeyDown={handleKeyDown}
                  onClick={() => {
                    if (!user && !isOwnerAccount) openAuthModal('login');
                  }}
                  onFocus={() => {
                    if (!user && !isOwnerAccount) openAuthModal('login');
                  }}
                  placeholder={
                    !user && !isOwnerAccount
                      ? '🔒 กรุณาเข้าสู่ระบบก่อนใช้งาน AI ผู้ช่วยอัจฉริยะ (สมาชิกรับฟรี 500 GemCoins ทุกวัน)'
                      : isUploadingMedia
                      ? 'กำลังประมวลผลไฟล์แนบ...'
                      : attachedImages.length > 0
                      ? `แนบรูปภาพแล้ว ${attachedImages.length} รูป (+${attachedImages.length * 25} GemCoins) พิมพ์คำถาม...`
                      : 'ถามเกี่ยวกับหุ้น ข่าวการเงิน หรือกลยุทธ์การลงทุน... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)'
                  }
                  rows={1}
                />

                {isLoading ? (
                  <button
                    type="button"
                    className="ai-abort-btn"
                    onClick={handleAbort}
                    title="ยกเลิกคำขอทันที (ไม่หัก GemCoins)"
                  >
                    <Square size={12} fill="currentColor" />
                    <span>หยุด</span>
                  </button>
                ) : (
                  <button
                    className="ai-send-action-btn"
                    onClick={() => {
                      if (!user && !isOwnerAccount) {
                        openAuthModal('login');
                        return;
                      }
                      handleSend();
                    }}
                    disabled={(!user && !isOwnerAccount) ? false : ((!inputMessage.trim() && attachedImages.length === 0 && attachedDocs.length === 0) || isLoading)}
                    title={(!user && !isOwnerAccount) ? "เข้าสู่ระบบเพื่อใช้งาน AI" : "ส่งข้อความ"}
                  >
                    {(!user && !isOwnerAccount) ? (
                      <Lock size={15} color="#94a3b8" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Subtext bar */}
              <div className="ai-input-subtext">
                <span>
                  {!user && !isOwnerAccount ? (
                    <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Lock size={11} color="#f59e0b" />
                      โหมด Guest: <strong style={{ color: '#f87171' }}>0 GemCoins</strong> (กรุณาเข้าสู่ระบบเพื่อรับโควตาฟรี 500 GemCoins/วัน)
                    </span>
                  ) : (
                    <>
                      โควตาฟรีวันนี้:{' '}
                      <strong className="ai-quota-daily">{dailyGemCoinsRemaining.toLocaleString()}</strong>
                      {' '}/{' '}{dailyGemCoins.toLocaleString()} · Top-up ถาวร:{' '}
                      <strong className="ai-quota-topup">{topupGemCoins.toLocaleString()}</strong>
                      {attachedImages.length > 0 && (
                        <span style={{ color: '#38bdf8', marginLeft: '6px' }}>
                          (+{attachedImages.length * 25} GemCoins Vision)
                        </span>
                      )}
                    </>
                  )}
                </span>
                <span style={{ display: 'none' }} className="sm-only">
                  DYOR: ข้อมูลเพื่อการศึกษาเท่านั้น
                </span>
              </div>
            </div>

            {/* System Notice Dialog (Rule 3: Oversized Document Alert) */}
            {systemNotice && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 100000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="glass-card"
                  style={{
                    maxWidth: '440px',
                    width: '100%',
                    padding: '24px',
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <AlertTriangle size={24} color="#ef4444" />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                    แจ้งเตือนสถานะเอกสาร
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {systemNotice}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="ios-btn"
                      onClick={() => setSystemNotice(null)}
                      style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                    >
                      เข้าใจแล้ว
                    </button>
                    <Link
                      href="/payments"
                      className="ios-btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.84rem', textDecoration: 'none' }}
                      onClick={() => setSystemNotice(null)}
                    >
                      ดูแพ็กเกจ VIP →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {/* Context Summary Inspector Modal */}
            {summaryModalText && (
              <div
                className="ai-hamburger-overlay"
                style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                onClick={() => setSummaryModalText(null)}
              >
                <div
                  className="ios-glass-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: '520px',
                    width: '100%',
                    padding: '24px',
                    borderRadius: '24px',
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Brain size={20} color="#38bdf8" />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                        บริบทที่ AI จดจำไว้ (Rolling Context)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSummaryModalText(null)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#94a3b8',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    ระบบสรุปประวัติอัตโนมัติ ช่วยลด Token ลง 75% และทำให้ AI เชื่อมโยงข้อมูลหุ้นและพอร์ตของคุณได้ต่อเนื่อง
                  </p>

                  <div
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '14px',
                      padding: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.84rem',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {summaryModalText}
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="ios-btn-primary"
                      onClick={() => setSummaryModalText(null)}
                      style={{ padding: '8px 20px', fontSize: '0.84rem' }}
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

