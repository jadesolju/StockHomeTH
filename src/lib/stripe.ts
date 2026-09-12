/**
 * Stripe singleton initializer (server-side only)
 * Import from here instead of creating new Stripe() in each route.
 */
import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_build_key';

export const stripe = new Stripe(apiKey, {
  apiVersion: '2026-08-26.dahlia',
});
