/**
 * Bot Subscriber Management Service (Supabase & In-Memory Fallback)
 *
 * Handles registration, category preferences, delivery rounds,
 * and subscription tier management (Free vs Pro) for Telegram and LINE members.
 */

import { supabase } from '@/lib/supabase/client';

export type DigestCategory = 'stocks' | 'gold' | 'business';
export type DeliveryRound = 'morning' | 'evening';
export type SubscriberTier = 'free' | 'pro';

export interface BotSubscriber {
  id: string;
  userId?: string;
  channel: 'telegram' | 'line';
  channelUserId: string;
  displayName?: string;
  username?: string;
  categories: DigestCategory[];
  deliveryRounds: DeliveryRound[];
  tier: SubscriberTier;
  isActive: boolean;
  isPaused: boolean;
  linkToken?: string;
  createdAt: string;
  updatedAt: string;
}

// In-Memory fallback store for subscribers (key: `${channel}:${channelUserId}`)
const memorySubscribers = new Map<string, BotSubscriber>();

/**
 * Normalizes lookup key
 */
function makeKey(channel: 'telegram' | 'line', channelUserId: string | number): string {
  return `${channel}:${channelUserId}`;
}

/**
 * Register a new subscriber or fetch existing profile
 */
export async function registerOrGetSubscriber(
  channel: 'telegram' | 'line',
  channelUserId: string | number,
  profile?: { displayName?: string; username?: string }
): Promise<BotSubscriber> {
  const cId = String(channelUserId);
  const key = makeKey(channel, cId);
  const nowIso = new Date().toISOString();

  // 1. Check in-memory store
  const existingMem = memorySubscribers.get(key);
  if (existingMem) {
    if (profile?.displayName && profile.displayName !== existingMem.displayName) {
      existingMem.displayName = profile.displayName;
    }
    if (profile?.username && profile.username !== existingMem.username) {
      existingMem.username = profile.username;
    }
    return existingMem;
  }

  // 2. Query Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bot_subscribers')
        .select('*')
        .eq('channel', channel)
        .eq('channel_user_id', cId)
        .maybeSingle();

      if (!error && data) {
        const sub: BotSubscriber = {
          id: data.id,
          userId: data.user_id,
          channel: data.channel,
          channelUserId: data.channel_user_id,
          displayName: data.display_name,
          username: data.username,
          categories: data.categories || ['stocks', 'gold', 'business'],
          deliveryRounds: data.delivery_rounds || ['morning', 'evening'],
          tier: data.tier || 'free',
          isActive: data.is_active ?? true,
          isPaused: data.is_paused ?? false,
          linkToken: data.link_token,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memorySubscribers.set(key, sub);
        return sub;
      }
    } catch (err) {
      console.warn('[botSubscriptionService] Supabase subscriber lookup error:', err);
    }
  }

  // 3. Create new default subscriber (Free Tier)
  const newSub: BotSubscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    channel,
    channelUserId: cId,
    displayName: profile?.displayName || `User_${cId.slice(-4)}`,
    username: profile?.username,
    categories: ['stocks', 'gold', 'business'],
    deliveryRounds: ['morning', 'evening'],
    tier: 'free',
    isActive: true,
    isPaused: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  memorySubscribers.set(key, newSub);

  // Try persisting to Supabase
  if (supabase) {
    try {
      await supabase.from('bot_subscribers').upsert(
        {
          channel,
          channel_user_id: cId,
          display_name: newSub.displayName,
          username: newSub.username,
          categories: newSub.categories,
          delivery_rounds: newSub.deliveryRounds,
          tier: newSub.tier,
          is_active: newSub.isActive,
          is_paused: newSub.isPaused,
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'channel,channel_user_id' }
      );
    } catch (err) {
      console.warn('[botSubscriptionService] Supabase insert fallback:', err);
    }
  }

  return newSub;
}

/**
 * Toggle or update subscriber categories
 */
export async function toggleSubscriberCategory(
  channel: 'telegram' | 'line',
  channelUserId: string | number,
  category: DigestCategory
): Promise<BotSubscriber> {
  const sub = await registerOrGetSubscriber(channel, channelUserId);
  const nowIso = new Date().toISOString();

  let nextCategories: DigestCategory[];
  if (sub.categories.includes(category)) {
    // Keep at least one category selected
    nextCategories = sub.categories.length > 1 ? sub.categories.filter((c) => c !== category) : sub.categories;
  } else {
    nextCategories = [...sub.categories, category];
  }

  sub.categories = nextCategories;
  sub.updatedAt = nowIso;
  memorySubscribers.set(makeKey(channel, channelUserId), sub);

  if (supabase) {
    try {
      await supabase
        .from('bot_subscribers')
        .update({ categories: nextCategories, updated_at: nowIso })
        .eq('channel', channel)
        .eq('channel_user_id', String(channelUserId));
    } catch {}
  }

  return sub;
}

/**
 * Toggle or update delivery rounds (morning / evening)
 */
export async function toggleSubscriberRound(
  channel: 'telegram' | 'line',
  channelUserId: string | number,
  round: DeliveryRound
): Promise<BotSubscriber> {
  const sub = await registerOrGetSubscriber(channel, channelUserId);
  const nowIso = new Date().toISOString();

  let nextRounds: DeliveryRound[];
  if (sub.deliveryRounds.includes(round)) {
    nextRounds = sub.deliveryRounds.length > 1 ? sub.deliveryRounds.filter((r) => r !== round) : sub.deliveryRounds;
  } else {
    nextRounds = [...sub.deliveryRounds, round];
  }

  sub.deliveryRounds = nextRounds;
  sub.updatedAt = nowIso;
  memorySubscribers.set(makeKey(channel, channelUserId), sub);

  if (supabase) {
    try {
      await supabase
        .from('bot_subscribers')
        .update({ delivery_rounds: nextRounds, updated_at: nowIso })
        .eq('channel', channel)
        .eq('channel_user_id', String(channelUserId));
    } catch {}
  }

  return sub;
}

/**
 * Pause or resume digest delivery
 */
export async function togglePauseSubscriber(
  channel: 'telegram' | 'line',
  channelUserId: string | number,
  pause?: boolean
): Promise<BotSubscriber> {
  const sub = await registerOrGetSubscriber(channel, channelUserId);
  const nowIso = new Date().toISOString();

  sub.isPaused = pause !== undefined ? pause : !sub.isPaused;
  sub.updatedAt = nowIso;
  memorySubscribers.set(makeKey(channel, channelUserId), sub);

  if (supabase) {
    try {
      await supabase
        .from('bot_subscribers')
        .update({ is_paused: sub.isPaused, updated_at: nowIso })
        .eq('channel', channel)
        .eq('channel_user_id', String(channelUserId));
    } catch {}
  }

  return sub;
}

/**
 * Get all active subscribers for a scheduled broadcast round
 */
export async function getActiveSubscribersForRound(
  round: DeliveryRound,
  category?: DigestCategory
): Promise<BotSubscriber[]> {
  const activeList: BotSubscriber[] = [];

  // 1. From Memory
  for (const sub of memorySubscribers.values()) {
    if (sub.isActive && !sub.isPaused && sub.deliveryRounds.includes(round)) {
      if (!category || sub.categories.includes(category)) {
        activeList.push(sub);
      }
    }
  }

  // 2. From Supabase if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bot_subscribers')
        .select('*')
        .eq('is_active', true)
        .eq('is_paused', false);

      if (!error && data && data.length > 0) {
        for (const row of data) {
          const rounds = row.delivery_rounds || ['morning', 'evening'];
          const cats = row.categories || ['stocks', 'gold', 'business'];
          if (rounds.includes(round) && (!category || cats.includes(category))) {
            const key = makeKey(row.channel, row.channel_user_id);
            if (!memorySubscribers.has(key)) {
              activeList.push({
                id: row.id,
                channel: row.channel,
                channelUserId: row.channel_user_id,
                displayName: row.display_name,
                username: row.username,
                categories: cats,
                deliveryRounds: rounds,
                tier: row.tier || 'free',
                isActive: row.is_active,
                isPaused: row.is_paused,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[botSubscriptionService] Supabase active fetch exception:', err);
    }
  }

  return activeList;
}
