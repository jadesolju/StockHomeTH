'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CURATED_MODELS,
  MODEL_FAMILIES,
  ModelFamily,
  ModelFamilyMeta,
  ModelSpec,
  getModelGemCoinsEst,
} from '@/config/curated-models';
import { FAMILY_ICON_MAP } from '@/components/ui/ModelFamilyIcons';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import { Lock } from 'lucide-react';

interface ModelPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: ModelSpec) => void;
  selectedModelId: string;
  currentTier: string;
}

const TIER_ORDER = ['free', 'lite', 'pro', 'vip', 'whale', 'dev'];

function isTierUnlocked(modelTier: string, userTier: string): boolean {
  if (userTier === 'dev') return true;
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(modelTier);
}

const TIER_LOCK_LABEL: Record<string, string> = {
  lite: 'Lite+',
  pro: 'Pro+',
  vip: 'VIP+',
  whale: 'Whale',
};

export const ModelPickerPopup: React.FC<ModelPickerPopupProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedModelId,
  currentTier,
}) => {
  const [activeFamily, setActiveFamily] = useState<ModelFamily | 'all'>('all');
  const popupRef = useRef<HTMLDivElement>(null);

  /* ── Close handlers ── */
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredModels =
    activeFamily === 'all'
      ? CURATED_MODELS
      : CURATED_MODELS.filter((m) => m.family === activeFamily);

  const getFamilyMeta = (key: string): ModelFamilyMeta | undefined =>
    MODEL_FAMILIES.find((f) => f.key === key);

  return (
    <div
      className="model-popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={popupRef}
        className="model-popup-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="model-popup-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="model-popup-title">
                เลือกโมเดล AI
              </div>
              {currentTier === 'dev' && (
                <span
                  style={{
                    background: 'rgba(236, 72, 153, 0.2)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    color: '#f472b6',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '100px',
                  }}
                >
                  DEV UNLOCKED
                </span>
              )}
            </div>
            <div className="model-popup-subtitle">
              คัดสรร {CURATED_MODELS.length} โมเดลชั้นนำ • แสดงอัตราการใช้ GemCoins ตามจริง (ไม่มีค่าบริการแอบแฝง)
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="model-popup-close-btn"
          >
            ✕
          </button>
        </div>

        {/* ── Family Filter Tabs ── */}
        <div className="model-popup-family-bar">
          {/* All tab */}
          <FamilyTabBtn
            isActive={activeFamily === 'all'}
            color="#38bdf8"
            onClick={() => setActiveFamily('all')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#38bdf8" fillOpacity="0.9" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#38bdf8" fillOpacity="0.6" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#38bdf8" fillOpacity="0.6" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#38bdf8" fillOpacity="0.9" />
            </svg>
            <span>ทั้งหมด</span>
          </FamilyTabBtn>

          {MODEL_FAMILIES.map((f) => {
            const FamilyIcon = FAMILY_ICON_MAP[f.key];
            const isActive = activeFamily === f.key;
            return (
              <FamilyTabBtn
                key={f.key}
                isActive={isActive}
                color={f.color}
                onClick={() => setActiveFamily(f.key as ModelFamily)}
              >
                {FamilyIcon && (
                  <FamilyIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                )}
                <span>{f.shortLabel}</span>
              </FamilyTabBtn>
            );
          })}
        </div>

        {/* ── Models Grid ── */}
        <div className="model-popup-grid">
          {filteredModels.map((model) => {
            const unlocked = isTierUnlocked(model.minTier, currentTier);
            const isSelected = model.id === selectedModelId;
            const family = getFamilyMeta(model.family);
            const color = family?.color || '#38bdf8';
            const FamilyIcon = FAMILY_ICON_MAP[model.family];

            return (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={isSelected}
                unlocked={unlocked}
                color={color}
                FamilyIcon={FamilyIcon}
                familyShortLabel={family?.shortLabel ?? model.family}
                tierLockLabel={TIER_LOCK_LABEL[model.minTier]}
                onSelect={() => {
                  if (unlocked) {
                    onSelect(model);
                    onClose();
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

interface FamilyTabBtnProps {
  isActive: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}
const FamilyTabBtn: React.FC<FamilyTabBtnProps> = ({ isActive, color, onClick, children }) => (
  <button
    onClick={onClick}
    className={`model-family-tab-btn ${isActive ? 'active' : ''}`}
    style={{
      borderColor: isActive ? color : undefined,
    }}
  >
    {children}
  </button>
);

interface ModelCardProps {
  model: ModelSpec;
  isSelected: boolean;
  unlocked: boolean;
  color: string;
  FamilyIcon?: React.FC<{ style?: React.CSSProperties }>;
  familyShortLabel: string;
  tierLockLabel?: string;
  onSelect: () => void;
}
const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  unlocked,
  color,
  FamilyIcon,
  familyShortLabel,
  tierLockLabel,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`model-card-btn ${isSelected ? 'selected' : ''}`}
      style={{
        borderColor: isSelected ? color : hovered && unlocked ? `${color}77` : undefined,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        opacity: unlocked ? 1 : 0.45,
        transform: hovered && unlocked && !isSelected ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Top-right badges */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '3px',
        }}
      >
        {model.isNew && (
          <Badge bg="rgba(16,185,129,0.22)" color="#10b981" border="rgba(16,185,129,0.3)">NEW</Badge>
        )}
        {model.isPopular && !model.isNew && (
          <Badge bg="rgba(56,189,248,0.18)" color="#0284c7" border="rgba(56,189,248,0.28)">HOT</Badge>
        )}
        {model.isFree && (
          <Badge bg="rgba(168,85,247,0.18)" color="#9333ea" border="rgba(168,85,247,0.28)">FREE</Badge>
        )}
        {!unlocked && model.minTier !== 'free' && tierLockLabel && (
          <Badge bg="rgba(245,158,11,0.15)" color="#b45309" border="rgba(245,158,11,0.25)">
            <Lock size={10} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} />
            {tierLockLabel}
          </Badge>
        )}
      </div>

      {/* Family row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginBottom: '1px',
        }}
      >
        {FamilyIcon && (
          <FamilyIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color, opacity: 0.9 }}>
          {familyShortLabel}
        </span>
      </div>

      {/* Model name */}
      <div className="model-card-name">
        {model.name}
      </div>

      {/* Tag + Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '100px',
            background: `${color}22`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {model.tag}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
          ctx {model.context}
        </span>
      </div>

      {/* Highlight */}
      <div className="model-card-highlight">
        {model.highlight}
      </div>

      {/* GemCoins estimate footer — NO raw USD In/Out tokens */}
      <div className="model-card-cost-row">
        <div className="model-card-gemcoin-pill">
          <GemCoinIcon size={12} glow={false} />
          <span>~{getModelGemCoinsEst(model)} GemCoins / คำถาม</span>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '10px',
            fontSize: '0.68rem',
            color,
            fontWeight: 800,
          }}
        >
          ✓ ใช้อยู่
        </div>
      )}
    </button>
  );
};

const Badge: React.FC<{
  bg: string; color: string; border: string; children: React.ReactNode;
}> = ({ bg, color, border, children }) => (
  <span
    style={{
      fontSize: '0.58rem',
      fontWeight: 800,
      padding: '1px 5px',
      borderRadius: '100px',
      background: bg,
      color,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);
