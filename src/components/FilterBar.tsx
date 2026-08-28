import React from 'react';
import type { NewsCategory, SentimentType } from '../types/stockNews';
import { Search, Filter, Layers } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (cat: NewsCategory) => void;
  selectedSentiment: 'all' | SentimentType;
  onSelectSentiment: (st: 'all' | SentimentType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES: { id: NewsCategory; label: string }[] = [
  { id: 'all', label: 'ทุกอุตสาหกรรม' },
  { id: 'macro', label: 'เศรษฐกิจมหภาค' },
  { id: 'tech', label: 'เทคฯ & ชิป AI' },
  { id: 'energy', label: 'พลังงาน & น้ำมัน' },
  { id: 'finance', label: 'การเงิน & ธนาคาร' },
  { id: 'retail', label: 'ค้าปลีก & ท่องเที่ยว' },
  { id: 'health', label: 'การแพทย์ & สุขภาพ' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSentiment,
  onSelectSentiment,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      
      {/* Top Search & Sentiment Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        
        {/* Search Input Box */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อหุ้น (e.g. PTT, NVDA), หัวข้อ หรือคำสำคัญ..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '100px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border 0.2s ease',
            }}
          />
        </div>

        {/* Sentiment Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginRight: '4px' }}>
            <Filter size={13} /> มุมมอง:
          </div>

          <button
            onClick={() => onSelectSentiment('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '100px',
              border: selectedSentiment === 'all' ? '1px solid var(--text-primary)' : '1px solid var(--glass-border)',
              background: selectedSentiment === 'all' ? 'var(--glass-bg-hover)' : 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            ทั้งหมด
          </button>

          <button
            onClick={() => onSelectSentiment('bullish')}
            className={`badge-sentiment badge-bullish`}
            style={{ cursor: 'pointer', opacity: selectedSentiment === 'all' || selectedSentiment === 'bullish' ? 1 : 0.4 }}
          >
            🟢 บวก (Bullish)
          </button>

          <button
            onClick={() => onSelectSentiment('bearish')}
            className={`badge-sentiment badge-bearish`}
            style={{ cursor: 'pointer', opacity: selectedSentiment === 'all' || selectedSentiment === 'bearish' ? 1 : 0.4 }}
          >
            🔴 ลบ (Bearish)
          </button>

          <button
            onClick={() => onSelectSentiment('neutral')}
            className={`badge-sentiment badge-neutral`}
            style={{ cursor: 'pointer', opacity: selectedSentiment === 'all' || selectedSentiment === 'neutral' ? 1 : 0.4 }}
          >
            ⚪ ปานกลาง
          </button>
        </div>

      </div>

      {/* Category Pills Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
          <Layers size={13} /> กลุ่ม:
        </div>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                background: isActive ? 'var(--accent-blue)' : 'var(--glass-bg)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

    </div>
  );
};
