'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CURATED_MODELS,
  MODEL_FAMILIES,
  ModelFamily,
  ModelFamilyMeta,
  ModelSpec,
} from '@/config/curated-models';
import { FAMILY_ICON_MAP } from '@/components/ui/ModelFamilyIcons';
import { Lock } from 'lucide-react';

interface ModelPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: ModelSpec) => void;
  selectedModelId: string;
  currentTier: string;
}

const TIER_ORDER = ['free', 'lite', 'pro', 'vip', 'whale'];

function isTierUnlocked(modelTier: string, userTier: string): boolean {
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0,0,0,0.76)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '72px',
        paddingLeft: '16px',
        paddingRight: '16px',
        animation: 'aiModalFadeIn 0.18s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={popupRef}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: 'calc(100vh - 110px)',
          background: '#0c1118',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '22px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.8), 0 0 40px rgba(6,182,212,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f1f5f9',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: '#080d12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
              เลือกโมเดล AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569' }}>
              คัดสรร {CURATED_MODELS.length} โมเดลยอดนิยมแต่ละตระกูล
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '8px',
              lineHeight: 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Family Filter Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 16px',
            background: '#080c12',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '10px',
            alignContent: 'start',
          }}
        >
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

        {/* ── Footer ── */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#080d12',
            fontSize: '0.7rem',
            color: '#475569',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
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
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      borderRadius: '100px',
      border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
      background: isActive ? `${color}22` : 'transparent',
      color: isActive ? color : '#94a3b8',
      fontSize: '0.75rem',
      fontWeight: 700,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s',
      fontFamily: 'inherit',
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

  const borderColor = isSelected
    ? color
    : hovered && unlocked
      ? `${color}66`
      : 'rgba(255,255,255,0.08)';

  const bgColor = isSelected
    ? `${color}18`
    : hovered && unlocked
      ? `${color}0c`
      : 'rgba(255,255,255,0.025)';

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 14px',
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        textAlign: 'left',
        cursor: unlocked ? 'pointer' : 'not-allowed',
        opacity: unlocked ? 1 : 0.45,
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        boxShadow: isSelected ? `0 0 18px ${color}28` : 'none',
        fontFamily: 'inherit',
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
          <Badge bg="rgba(16,185,129,0.22)" color="#34d399" border="rgba(16,185,129,0.3)">NEW</Badge>
        )}
        {model.isPopular && !model.isNew && (
          <Badge bg="rgba(56,189,248,0.18)" color="#38bdf8" border="rgba(56,189,248,0.28)">HOT</Badge>
        )}
        {model.isFree && (
          <Badge bg="rgba(168,85,247,0.18)" color="#c084fc" border="rgba(168,85,247,0.28)">FREE</Badge>
        )}
        {!unlocked && model.minTier !== 'free' && tierLockLabel && (
          <Badge bg="rgba(245,158,11,0.15)" color="#fbbf24" border="rgba(245,158,11,0.25)">
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
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color, opacity: 0.85 }}>
          {familyShortLabel}
        </span>
      </div>

      {/* Model name */}
      <div
        style={{
          fontSize: '0.88rem',
          fontWeight: 800,
          color: '#fff',
          paddingRight: '40px',
          lineHeight: 1.25,
        }}
      >
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
      <div
        style={{
          fontSize: '0.72rem',
          color: '#94a3b8',
          lineHeight: 1.45,
        }}
      >
        {model.highlight}
      </div>

      {/* Pricing footer */}
      <div
        style={{
          marginTop: '4px',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '10px',
          fontSize: '0.65rem',
          color: '#64748b',
        }}
      >
        <span>In: <strong style={{ color: '#94a3b8' }}>{model.priceInput}</strong></span>
        <span>Out: <strong style={{ color: '#94a3b8' }}>{model.priceOutput}</strong></span>
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
