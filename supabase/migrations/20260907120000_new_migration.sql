-- =========================================================================
-- StockHomeTH Supabase Production Schema & Security Configuration
-- Migration: 20260907120000_new_migration.sql
-- (Idempotent: Safe to re-run multiple times)
-- =========================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

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
