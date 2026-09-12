/**
 * Utility functions for sanitizing and purging local authentication & authorization tokens.
 * Prevents God Mode / Dev privileges from persisting in guest or logged-out browser storage.
 */

export function purgeDevStorage() {
  try {
    if (typeof window === 'undefined') return;

    const currentTier = localStorage.getItem('stockhome_local_subscription_tier');
    if (!currentTier || currentTier === 'dev') {
      localStorage.setItem('stockhome_local_subscription_tier', 'free');
    }

    const daily = localStorage.getItem('stockhome_gemcoin_daily_remaining');
    if (daily === '10000000' || !daily) {
      localStorage.setItem('stockhome_gemcoin_daily_remaining', '500');
    }

    const topup = localStorage.getItem('stockhome_gemcoin_topup_balance');
    if (topup === '99999999') {
      localStorage.setItem('stockhome_gemcoin_topup_balance', '0');
    }
  } catch (err) {
    console.error('[AuthStorage] Failed to purge dev storage:', err);
  }
}
