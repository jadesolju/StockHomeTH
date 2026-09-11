/**
 * Maps each GemCoin package ID and Subscription Tier to the exact Stripe Live Price ID.
 * 
 * Configured with live Price IDs from Stripe Live Account.
 */
export const GEMCOIN_STRIPE_PRICE_IDS: Record<string, string> = {
  'pack-piggy':     'price_1UEMs1Jd1OQJEUhCnGHD5okG', // 19 THB  – 1,500 GemCoins
  'pack-wallet':    'price_1UEMs5Jd1OQJEUhCRE6OgHYD', // 39 THB  – 4,000 GemCoins
  'pack-briefcase': 'price_1UEMs4Jd1OQJEUhCNEkCtnkM', // 89 THB  – 10,500 GemCoins
  'pack-roadster':  'price_1UEMs4Jd1OQJEUhCI6Ixg0nu', // 199 THB – 30,000 GemCoins
  'pack-crown':     'price_1UEMs5Jd1OQJEUhCZ6CeEJOs', // 499 THB – 85,000 GemCoins
  'pack-rocket':    'price_1UEMs5Jd1OQJEUhCHyDu3kER', // 999 THB – 190,000 GemCoins
  'pack-castle':    'price_1UEMs6Jd1OQJEUhChwgTG5et', // 1,999 THB – 450,000 GemCoins
  'pack-whale':     'price_1UEMs0Jd1OQJEUhCigAO0iFx', // 3,999 THB – 1,050,000 GemCoins
};

/** Stripe Live Price IDs for subscription plans – monthly */
export const SUBSCRIPTION_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'price_1UEMs5Jd1OQJEUhCMz1rHlld', // 89 THB/month
  'pro':   'price_1UEMsAJd1OQJEUhCkGZoUZq6', // 299 THB/month
  'vip':   'price_1UEMs5Jd1OQJEUhCKLMYwjBy', // 999 THB/month
  'whale': 'price_1UEMsAJd1OQJEUhCAmw7K3WL', // 2,499 THB/month
};

/** Stripe Live Price IDs for subscription plans – yearly */
export const SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'price_1UEMs3Jd1OQJEUhCzQDvj2RU', // 890 THB/year
  'pro':   'price_1UEMs5Jd1OQJEUhCBfRFStl2', // 2,990 THB/year
  'vip':   'price_1UEMs4Jd1OQJEUhCUAlUv5Iw', // 9,990 THB/year
  'whale': 'price_1UEMs6Jd1OQJEUhCjUd4qoFk', // 24,990 THB/year
};

