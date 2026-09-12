/**
 * Utility functions for sanitizing and purging local authentication & authorization tokens.
 * Prevents God Mode / Dev privileges from persisting in guest or logged-out browser storage.
 */

export function purgeDevStorage() {
  try {
    if (typeof window === 'undefined') return;

    // Purge legacy un-scoped keys that cause cross-account coin leakage
    localStorage.removeItem('stockhome_gemcoin_topup_balance');
    localStorage.removeItem('stockhome_gemcoin_daily_remaining');
    localStorage.removeItem('stockhome_gemcoin_logs');
    localStorage.removeItem('stockhome_local_subscription_tier');
    localStorage.removeItem('stockhome_local_ai_reset_date');
    localStorage.removeItem('stockhome_local_ai_usage_count');
  } catch (err) {
    console.error('[AuthStorage] Failed to purge dev storage:', err);
  }
}
