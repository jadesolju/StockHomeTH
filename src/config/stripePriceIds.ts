/**
 * Maps each GemCoin package ID and Subscription Tier to the exact Stripe Live Price ID.
 * 
 * Verified from Stripe Dashboard prices.csv export.
 */
export const GEMCOIN_STRIPE_PRICE_IDS: Record<string, string> = {
  'pack-piggy':     'price_1UEMs1Jd1OQJEUhCnGHD5okG', // 19 THB  – 1,500 GemCoins (prod_VEoOjltGqJwMu1)
  'pack-wallet':    'price_1UEMs5Jd1OQJEUhCRE6OgHYD', // 39 THB  – 4,000 GemCoins (prod_VEoPPiJ5nI4dsq)
  'pack-briefcase': 'price_1UEMs4Jd1OQJEUhCNEkCtnkM', // 89 THB  – 10,500 GemCoins (prod_VEoQcz6shJSx50)
  'pack-roadster':  'price_1UEMs4Jd1OQJEUhCI6Ixg0nu', // 199 THB – 30,000 GemCoins (prod_VEoSxzXYgaThbj)
  'pack-crown':     'price_1UEMs5Jd1OQJEUhCZ6CeEJOs', // 499 THB – 85,000 GemCoins (prod_VEoTncx0UwRael)
  'pack-rocket':    'price_1UEMs5Jd1OQJEUhCHyDu3kER', // 999 THB – 190,000 GemCoins (prod_VEoUzYp0PFKVSx)
  'pack-castle':    'price_1UEMs6Jd1OQJEUhChwgTG5et', // 1,999 THB – 450,000 GemCoins (prod_VEoWciBnDZAf7J)
  'pack-whale':     'price_1UEMs0Jd1OQJEUhCigAO0iFx', // 3,999 THB – 1,050,000 GemCoins (prod_VEoZjbRYkg8Fxc)
};

/** Stripe Live Price IDs for subscription plans – monthly */
export const SUBSCRIPTION_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'price_1UEMs5Jd1OQJEUhCMz1rHlld', // 89 THB/mo (prod_VEF4gNUQx4Gtdu)
  'pro':   'price_1UEMsAJd1OQJEUhCkGZoUZq6', // 299 THB/mo (prod_VEF8wqGQKriJnZ)
  'vip':   'price_1UEMs5Jd1OQJEUhCKLMYwjBy', // 999 THB/mo (prod_VEFBBj7sPqcEqr)
  'whale': 'price_1UEMsAJd1OQJEUhCAmw7K3WL', // 2,499 THB/mo (prod_VEFEtj59b72Ot9)
};

/** Stripe Live Price IDs for subscription plans – yearly */
export const SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS: Record<string, string> = {
  'lite':  'price_1UEMs3Jd1OQJEUhCzQDvj2RU', // 890 THB/yr (prod_VEoDTrElbDGM7R)
  'pro':   'price_1UEMs5Jd1OQJEUhCBfRFStl2', // 2,990 THB/yr (prod_VEoHeKRgl4fyJb)
  'vip':   'price_1UEMs4Jd1OQJEUhCUAlUv5Iw', // 9,990 THB/yr (prod_VEoKqWe5VOQrAv)
  'whale': 'price_1UEMs6Jd1OQJEUhCjUd4qoFk', // 24,990 THB/yr (prod_VEoMm8l7262P3d)
};
