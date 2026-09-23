-- =========================================================================
-- StockHomeTH Supabase Production Master Schema
-- (Idempotent: Safe to re-run multiple times)
-- =========================================================================

-- 1. Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Admin Whitelist Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin', 'editor')),
  created_at timestamptz DEFAULT now()
);

-- 3. Stocks Master Catalog & Fundamentals (SET, MAI, US, CRYPTO, INDEX)
CREATE TABLE IF NOT EXISTS public.stocks (
  ticker text PRIMARY KEY,
  name text NOT NULL,
  market text NOT NULL CHECK (market IN ('SET', 'MAI', 'US', 'CRYPTO', 'INDEX')),
  sector text,
  price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'THB',
  change numeric DEFAULT 0,
  market_cap text,
  pe_ratio numeric,
  dividend_yield numeric,
  high_52w numeric,
  low_52w numeric,
  volume text,
  ai_insight text,
  description text,
  sparkline_7d jsonb DEFAULT '[]'::jsonb,
  analyst_rating text DEFAULT 'Hold',
  target_price numeric,
  sentiment_score integer DEFAULT 50,
  analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'completed', 'failed', 'processing')),
  analysis_payload jsonb DEFAULT '{}'::jsonb,
  price_history_sample jsonb DEFAULT '[]'::jsonb,
  technical_indicators jsonb DEFAULT '{}'::jsonb,
  last_fetched_at timestamptz DEFAULT now(),
  last_analyzed_at timestamptz,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stocks_market ON public.stocks(market);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON public.stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON public.stocks(analysis_status);
CREATE INDEX IF NOT EXISTS idx_stocks_updated_at ON public.stocks(updated_at DESC);

-- 4. Bot Subscribers Table (Telegram & LINE Multi-Channel Digest Bot)
CREATE TABLE IF NOT EXISTS public.bot_subscribers (
  id text PRIMARY KEY,
  user_id text,
  channel text NOT NULL CHECK (channel IN ('telegram', 'line')),
  channel_user_id text NOT NULL,
  display_name text,
  username text,
  categories text[] DEFAULT ARRAY['stocks', 'gold', 'business'],
  delivery_rounds text[] DEFAULT ARRAY['morning', 'evening'],
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  is_active boolean DEFAULT true,
  is_paused boolean DEFAULT false,
  link_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_bot_subscribers_channel_user UNIQUE (channel, channel_user_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_sub_channel_user ON public.bot_subscribers(channel, channel_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sub_active ON public.bot_subscribers(is_active);

-- 5. News Items Table
CREATE TABLE IF NOT EXISTS public.news_items (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text,
  full_content text,
  link text NOT NULL,
  source text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  relevance_score integer NOT NULL DEFAULT 50,
  relevance_level text DEFAULT 'medium' CHECK (relevance_level IN ('high', 'medium', 'low', 'unrelated')),
  impact_level text DEFAULT 'neutral' CHECK (impact_level IN ('high_positive', 'positive', 'neutral', 'negative', 'high_negative')),
  symbols text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_relevance_score ON public.news_items(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_published ON public.news_items(is_published);

-- 6. User Bookmarks Table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  news_id text NOT NULL,
  title text NOT NULL,
  source text DEFAULT 'StockHomeTH',
  link text DEFAULT '',
  symbols text[] DEFAULT '{}',
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_user_bookmarks UNIQUE (user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_news ON public.user_bookmarks(news_id);

-- 7. User Profiles Table (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'pro', 'vip', 'whale', 'dev', 'admin', 'superadmin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. User Wallets Table (GemCoins & Subscription Status)
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id text PRIMARY KEY,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'vip', 'whale', 'dev')),
  daily_gem_coins integer DEFAULT 500,
  daily_gem_coins_remaining integer DEFAULT 500,
  topup_gem_coins integer DEFAULT 0,
  last_reset_date text DEFAULT to_char(now(), 'YYYY-MM-DD'),
  updated_at timestamptz DEFAULT now()
);

-- 9. User Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.user_wallet_transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('deduct', 'credit', 'reset', 'bonus', 'refund', 'subscription')),
  amount integer NOT NULL DEFAULT 0,
  model_name text,
  summary text,
  created_at timestamptz DEFAULT now()
);

-- 10. AI Semantic Caching Table
CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text text NOT NULL,
  prompt_hash text UNIQUE NOT NULL,
  ticker text,
  response_text text NOT NULL,
  model text NOT NULL,
  embedding vector(1536),
  category text DEFAULT 'general' CHECK (category IN ('financial_report', 'daily_analysis', 'realtime_price', 'general')),
  ttl_seconds integer DEFAULT 86400,
  expires_at timestamptz DEFAULT (now() + interval '1 day'),
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_ticker ON public.ai_semantic_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_hash ON public.ai_semantic_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires ON public.ai_semantic_cache(expires_at);

-- 11. Row Level Security (RLS) Configuration
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_semantic_cache ENABLE ROW LEVEL SECURITY;

-- Permissive and Service Role Policies
CREATE POLICY "Public Read Stocks" ON public.stocks FOR SELECT USING (is_active = true);
CREATE POLICY "Service Role Full Access Stocks" ON public.stocks FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Bot Subs" ON public.bot_subscribers FOR SELECT USING (true);
CREATE POLICY "Service Role Full Access Bot" ON public.bot_subscribers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Read News" ON public.news_items FOR SELECT USING (is_published = true);
CREATE POLICY "Service Role Full Access News" ON public.news_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Manage Bookmarks" ON public.user_bookmarks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Wallets" ON public.user_wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Wallet TX" ON public.user_wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Semantic Cache" ON public.ai_semantic_cache FOR ALL USING (true) WITH CHECK (true);
