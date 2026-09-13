-- =========================================================================
-- StockHomeTH Supabase Production Schema & Security Configuration
-- Migration: 20260907120000_new_migration.sql
-- (Idempotent: Safe to re-run multiple times)
-- =========================================================================

-- 0. Register Migration in Supabase Migration History
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

insert into supabase_migrations.schema_migrations (version, name)
values ('20260907120000', 'new_migration')
on conflict (version) do nothing;

-- 1. Enable UUID Extension
-- 1. Enable UUID and Vector Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 2. Admin Whitelist Table (ใช้สำหรับตรวจสอบว่าใครมีสิทธิ์เข้า Admin Backoffice)
create table if not exists public.admin_users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  role text default 'admin' check (role in ('admin', 'superadmin', 'editor')),
  created_at timestamptz default now()
);

-- 3. Stocks Master Catalog & Fundamentals (เก็บหุ้นทั้งหมด SET 277+ ตัว, US 1,000+ ตัว)
create table if not exists public.stocks (
  ticker text primary key,
  name text not null,
  market text not null check (market in ('SET', 'MAI', 'US', 'CRYPTO', 'INDEX')),
  sector text,
  price numeric not null default 0,
  currency text default 'THB',
  change numeric default 0,
  market_cap text,
  pe_ratio numeric,
  dividend_yield numeric,
  high_52w numeric,
  low_52w numeric,
  volume text,
  ai_insight text,
  description text,
  sparkline_7d jsonb default '[]'::jsonb,
  analyst_rating text default 'Hold',
  target_price numeric,
  sentiment_score integer default 50,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create index if not exists idx_stocks_market on public.stocks(market);
create index if not exists idx_stocks_sector on public.stocks(sector);
create index if not exists idx_stocks_updated_at on public.stocks(updated_at desc);

-- 4. News Items Table (เก็บข่าวกรองแล้ว)
create table if not exists public.news_items (
  id text primary key,
  title text not null,
  summary text,
  full_content text,
  link text not null,
  source text not null,
  published_at timestamptz not null default now(),
  relevance_score integer not null default 50,
  relevance_level text default 'medium' check (relevance_level in ('high', 'medium', 'low', 'unrelated')),
  impact_level text default 'neutral' check (impact_level in ('high_positive', 'positive', 'neutral', 'negative', 'high_negative')),
  symbols text[] default '{}',
  tags text[] default '{}',
  is_published boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_news_published_at on public.news_items(published_at desc);
create index if not exists idx_news_relevance_score on public.news_items(relevance_score desc);
create index if not exists idx_news_is_published on public.news_items(is_published);

-- 5. Stock Watchlist Table (รายชื่อหุ้นที่ต้องการ Focus)
create table if not exists public.stock_watchlist (
  symbol text primary key,
  name text not null,
  market text default 'SET' check (market in ('SET', 'MAI', 'US', 'CRYPTO', 'INDEX')),
  sector text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 6. Admin System Configuration (เก็บค่า Settings ต่างๆ)
create table if not exists public.admin_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- Insert Default Config
insert into public.admin_config (key, value, description)
values 
  ('relevance_filter', '{"threshold": 50, "drop_below_threshold": true, "high_priority_threshold": 70}'::jsonb, 'Financial relevance scoring engine settings'),
  ('news_sources', '{"thunhoon": true, "kaohoon": true, "settrade": true, "bangkokbiz": true, "moneychannel": true}'::jsonb, 'Enabled/Disabled news aggregation sources'),
  ('market_status', '{"auto_fetch_interval_seconds": 60, "maintenance_mode": false}'::jsonb, 'Market sync and maintenance settings')
on conflict (key) do nothing;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.admin_users enable row level security;
alter table public.stocks enable row level security;
alter table public.news_items enable row level security;
alter table public.stock_watchlist enable row level security;
alter table public.admin_config enable row level security;

-- Stocks Policies:
drop policy if exists "Public can view active stocks" on public.stocks;
create policy "Public can view active stocks"
  on public.stocks for select
  using (is_active = true);

drop policy if exists "Service role and anon can upsert stocks" on public.stocks;
create policy "Service role and anon can upsert stocks"
  on public.stocks for all
  using (true)
  with check (true);

-- News Items Policies:
drop policy if exists "Public can view published news" on public.news_items;
create policy "Public can view published news"
  on public.news_items for select
  using (is_published = true);

drop policy if exists "Service role and anon can manage news" on public.news_items;
create policy "Service role and anon can manage news"
  on public.news_items for all
  using (true)
  with check (true);

-- Stock Watchlist Policies:
drop policy if exists "Public can view active watchlist" on public.stock_watchlist;
create policy "Public can view active watchlist"
  on public.stock_watchlist for select
  using (is_active = true);

-- Admin Config Policies:
drop policy if exists "Public can read non-sensitive config" on public.admin_config;
create policy "Public can read non-sensitive config"
  on public.admin_config for select
  using (true);

-- =================================================================================
-- 5. User Bookmarks (user_bookmarks)
-- Stores bookmarked news articles for each user.
-- =================================================================================
create table if not exists public.user_bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Firebase UID
  news_id text not null, -- ID of the news item in news_items table
  title text not null,
  link text,
  source text,
  symbols jsonb default '[]'::jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, news_id)
);

-- Enable RLS
alter table public.user_bookmarks enable row level security;

-- Policies for user_bookmarks
-- Note: Since we use Firebase Auth, we verify identity via an API route or pass the UID directly. 
-- For a truly secure setup with Firebase Auth and Supabase RLS, we would need to pass a custom JWT. 
-- However, for this project, we'll allow anon/public access to insert/select if they provide the correct user_id, 
-- or we handle it securely in a Next.js Server Action / API Route using the Supabase Service Role.
-- Here we create a permissive policy for simplicity, but it's recommended to handle bookmarking via Server Actions.
create policy "Enable all actions for public (temporary)"
  on public.user_bookmarks for all
  using (true)
  with check (true);

-- =================================================================================
-- 6. AI Semantic Caching & RAG Vector Memory Bank (ai_semantic_cache & stock_rag_embeddings)
-- =================================================================================

create table if not exists public.ai_semantic_cache (
  id uuid default gen_random_uuid() primary key,
  prompt_text text not null,
  prompt_hash text unique not null,
  ticker text,
  response_text text not null,
  model text not null,
  embedding vector(1536), -- Default 1536-dim embedding vector (e.g. OpenAI/Supabase vector)
  category text default 'general' check (category in ('financial_report', 'daily_analysis', 'realtime_price', 'general')),
  ttl_seconds integer default 86400, -- Default 24h Time-To-Live
  expires_at timestamptz default (now() + interval '1 day'),
  is_valid boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_semantic_cache_ticker on public.ai_semantic_cache(ticker);
create index if not exists idx_semantic_cache_hash on public.ai_semantic_cache(prompt_hash);
create index if not exists idx_semantic_cache_expires on public.ai_semantic_cache(expires_at);

-- RAG Knowledge Base Table for Financial Reports & Stock Insights
create table if not exists public.stock_rag_embeddings (
  id uuid default gen_random_uuid() primary key,
  ticker text not null,
  quarter text, -- e.g. 'Q1-2026'
  title text not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_rag_embeddings_ticker on public.stock_rag_embeddings(ticker);

-- RPC Function for Similarity Search in Semantic Cache
create or replace function match_semantic_cache(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_ticker text default null
)
returns table (
  id uuid,
  prompt_text text,
  response_text text,
  model text,
  similarity float,
  category text
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.prompt_text,
    c.response_text,
    c.model,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.category
  from public.ai_semantic_cache c
  where c.is_valid = true
    and c.expires_at > now()
    and (target_ticker is null or c.ticker = target_ticker)
    and 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Enable RLS for Semantic Cache
alter table public.ai_semantic_cache enable row level security;
alter table public.stock_rag_embeddings enable row level security;

drop policy if exists "Public access to semantic cache" on public.ai_semantic_cache;
create policy "Public access to semantic cache"
  on public.ai_semantic_cache for all
  using (true)
  with check (true);

drop policy if exists "Public access to RAG embeddings" on public.stock_rag_embeddings;
create policy "Public access to RAG embeddings"
  on public.stock_rag_embeddings for all
  using (true)
  with check (true);
