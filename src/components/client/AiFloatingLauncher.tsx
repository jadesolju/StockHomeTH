'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import { useSubscription } from '@/lib/context/SubscriptionContext';

export const AiFloatingLauncher: React.FC = () => {
  const pathname = usePathname();
  const { totalGemCoinsAvailable } = useSubscription();

  // Hide launcher on /ai-helper page to avoid redundancy
  if (pathname === '/ai-helper') return null;

  return (
    <aside aria-label="AI Floating Assistant Launcher">
      <Link href="/ai-helper" className="ai-floating-launcher-btn" title="เปิดผู้ช่วย AI วิเคราะห์หุ้น">
        <GemCoinIcon size={24} glow />
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            AI Helper
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4ade80',
                display: 'inline-block',
                animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
          </span>
          <span style={{ fontSize: '0.65rem', color: '#67e8f9', fontFamily: 'monospace' }}>
            {totalGemCoinsAvailable.toLocaleString()} GemCoins
          </span>
        </div>
      </Link>
    </aside>
  );
};
