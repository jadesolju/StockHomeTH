'use client';

import React from 'react';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { toggleBookmark } from '../../lib/services/bookmarkService';
import { NewsDetailSheet } from './NewsDetailSheet';

export function GlobalNewsModal() {
  const { activeNewsModal, setActiveNewsModal } = useMarketSync();
  const { user, openAuthModal } = useClientAuth();

  if (!activeNewsModal) return null;

  const handleToggleBookmark = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeNewsModal || activeNewsModal.id !== id) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    const currentlyBookmarked = activeNewsModal.isBookmarked || false;
    // Optimistic UI update
    setActiveNewsModal({
      ...activeNewsModal,
      isBookmarked: !currentlyBookmarked,
    });

    try {
      await toggleBookmark(user.uid, activeNewsModal, currentlyBookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  return (
    <NewsDetailSheet
      item={activeNewsModal}
      onClose={() => setActiveNewsModal(null)}
      onToggleBookmark={handleToggleBookmark}
    />
  );
}

