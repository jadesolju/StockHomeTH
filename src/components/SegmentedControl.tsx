import React from 'react';
import type { MarketRegion, TimeframeType } from '../types/stockNews';
import { Calendar, Clock, Globe, Flag } from 'lucide-react';

interface SegmentedControlProps {
  timeframe: TimeframeType;
  onChangeTimeframe: (tf: TimeframeType) => void;
  region: MarketRegion;
  onChangeRegion: (rg: MarketRegion) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  timeframe,
  onChangeTimeframe,
  region,
  onChangeRegion,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px'
    }}>
      
      {/* Timeframe Switcher (Daily vs Weekly) */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
          รอบระยะเวลาสรุปข่าว
        </div>
        <div className="ios-segmented-control">
          <button
            className={`ios-segment-btn ${timeframe === 'daily' ? 'active' : ''}`}
            onClick={() => onChangeTimeframe('daily')}
          >
            <Clock size={15} />
            <span>สรุปรายวัน (Daily)</span>
          </button>

          <button
            className={`ios-segment-btn ${timeframe === 'weekly' ? 'active' : ''}`}
            onClick={() => onChangeTimeframe('weekly')}
          >
            <Calendar size={15} />
            <span>สรุปรายสัปดาห์ (Weekly)</span>
          </button>
        </div>
      </div>

      {/* Region Switcher (All vs Thai vs Global) */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
          ตลาดหุ้นเป้าหมาย
        </div>
        <div className="ios-segmented-control">
          <button
            className={`ios-segment-btn ${region === 'all' ? 'active' : ''}`}
            onClick={() => onChangeRegion('all')}
          >
            <Globe size={15} />
            <span>ทั้งหมด</span>
          </button>

          <button
            className={`ios-segment-btn ${region === 'thai' ? 'active' : ''}`}
            onClick={() => onChangeRegion('thai')}
          >
            <Flag size={15} />
            <span>หุ้นไทย (SET)</span>
          </button>

          <button
            className={`ios-segment-btn ${region === 'global' ? 'active' : ''}`}
            onClick={() => onChangeRegion('global')}
          >
            <Globe size={15} />
            <span>หุ้นต่างประเทศ (US/Global)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
