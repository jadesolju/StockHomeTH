/**
 * Maps each GemCoin package ID and Subscription Tier to the Stripe Product / Price ID.
 * 
 * Configured with live Product IDs created in Stripe Dashboard.
 */
export const GEMCOIN_STRIPE_PRICE_IDS: Record<string, string> = {
  'pack-piggy':     'prod_VEoOjltGqJwMu1', // 19 THB  – 1,500 GemCoins
  'pack-wallet':    'prod_VEoPPiJ5nI4dsq', // 39 THB  – 4,000 GemCoins
  'pack-briefcase': 'prod_VEoQcz6shJSx50', // 89 THB  – 10,500 GemCoins
  'pack-roadster':  'prod_VEoSxzXYgaThbj', // 199 THB – 30,000 GemCoins
  'pack-crown':     'prod_VEoTncx0UwRael', // 499 THB – 85,000 GemCoins
  'pack-rocket':    'prod_VEoUzYp0PFKVSx', // 999 THB – 190,000 GemCoins
  'pack-castle':     'prod_VEoWciBnDZAf7J', // 1,999 THB – 450,000 GemCoins
  'pack-whale':     'prod_VEoZjbRYkg8Fxc', // 3,999 THB – 1,050,000 GemCoins
};

/** Stripe Product / Price IDs for subscription plans – monthly */
export const SUBSCRIPTION_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'prod_VEF4gNUQx4Gtdu', // 89 THB/month
  'pro':   'prod_VEF8wqGQKriJnZ', // 299 THB/month
  'vip':   'prod_VEFBBj7sPqcEqr', // 999 THB/month
  'whale': 'prod_VEFEtj59b72Ot9', // 2,499 THB/month
};

/** Stripe Product / Price IDs for subscription plans – yearly */
export const SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'prod_VEoDTrElbDGM7R', // 890 THB/year
  'pro':   'prod_VEoHeKRgl4fyJb', // 2,990 THB/year
  'vip':   'prod_VEoKqWe5VOQrAv', // 9,990 THB/year
  'whale': 'prod_VEoMm8l7262P3d', // 24,990 THB/year
};
