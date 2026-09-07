'use client';

import React from 'react';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { NewsDetailSheet } from './NewsDetailSheet';

export function GlobalNewsModal() {
  const { activeNewsModal, setActiveNewsModal } = useMarketSync();

  if (!activeNewsModal) return null;

  return (
    <NewsDetailSheet
      item={activeNewsModal}
      onClose={() => setActiveNewsModal(null)}
      onToggleBookmark={(id, e) => {
        // Toggle bookmark state locally on the active modal item if needed
        if (activeNewsModal && activeNewsModal.id === id) {
          setActiveNewsModal({
            ...activeNewsModal,
            isBookmarked: !activeNewsModal.isBookmarked,
          });
        }
      }}
    />
  );
}
