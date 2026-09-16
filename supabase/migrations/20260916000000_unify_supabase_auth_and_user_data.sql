-- =========================================================================
-- StockHomeTH Supabase Schema & Auth Unification Migration
-- Migration: 20260916000000_unify_supabase_auth_and_user_data.sql
-- Single Source of Truth for Supabase Auth & Cloud Data Storage
-- (Idempotent: Safe to re-run multiple times)
-- =========================================================================

-- 1. Ensure UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (Linked to auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'pro', 'vip', 'whale', 'dev', 'admin', 'superadmin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_profiles_email on public.user_profiles(email);

-- 3. User Cloud Wallets Table (GemCoins & Subscription Status)
create table if not exists public.user_wallets (
  user_id text primary key, -- Text to allow UUID or guest/legacy IDs
  tier text default 'free' check (tier in ('free', 'pro', 'vip', 'whale', 'dev')),
  daily_gem_coins integer default 500,
  daily_gem_coins_remaining integer default 500,
  topup_gem_coins integer default 0,
  last_reset_date text default to_char(now(), 'YYYY-MM-DD'),
  updated_at timestamptz default now()
);

create index if not exists idx_user_wallets_user_id on public.user_wallets(user_id);
create index if not exists idx_user_wallets_updated_at on public.user_wallets(updated_at desc);

-- 4. User Wallet Transactions Table (History Logs)
create table if not exists public.user_wallet_transactions (
  id text primary key,
  user_id text not null,
  type text not null check (type in ('deduct', 'credit', 'reset', 'bonus', 'refund', 'subscription')),
  amount integer not null default 0,
  model_name text,
  summary text,
  created_at timestamptz default now()
);

create index if not exists idx_user_wallet_tx_user_id on public.user_wallet_transactions(user_id);
create index if not exists idx_user_wallet_tx_created_at on public.user_wallet_transactions(created_at desc);

-- 5. User Chat Sessions Table (AI Assistant History)
create table if not exists public.user_chat_sessions (
  id text primary key,
  user_id text not null,
  title text not null default 'การสนทนาใหม่',
  model_id text not null default 'default',
  messages jsonb not null default '[]'::jsonb,
  context_summary text,
  summarized_up_to_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_chat_sessions_user_id on public.user_chat_sessions(user_id);
create index if not exists idx_user_chat_sessions_updated_at on public.user_chat_sessions(updated_at desc);

-- 6. User Bookmarks Table (Saved Stocks & News)
create table if not exists public.user_bookmarks (
  id bigint generated always as identity primary key,
  user_id text not null,
  news_id text not null,
  title text not null,
  source text default 'StockHomeTH',
  link text default '',
  symbols text[] default '{}',
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint uq_user_bookmarks_user_news unique (user_id, news_id)
);

create index if not exists idx_user_bookmarks_user_id on public.user_bookmarks(user_id);
create index if not exists idx_user_bookmarks_news_id on public.user_bookmarks(news_id);
create index if not exists idx_user_bookmarks_created_at on public.user_bookmarks(created_at desc);

-- =========================================================================
-- 7. Automatic User Profile & Wallet Initialization Trigger
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  raw_avatar text;
  today_str text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  raw_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );
  today_str := to_char(now(), 'YYYY-MM-DD');

  -- 1. Insert Profile
  insert into public.user_profiles (id, email, display_name, avatar_url, role)
  values (new.id, new.email, raw_name, raw_avatar, 'user')
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
      avatar_url = coalesce(nullif(public.user_profiles.avatar_url, ''), excluded.avatar_url),
      updated_at = now();

  -- 2. Insert Default Wallet
  insert into public.user_wallets (user_id, tier, daily_gem_coins, daily_gem_coins_remaining, topup_gem_coins, last_reset_date, updated_at)
  values (new.id::text, 'free', 500, 500, 0, today_str, now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop and re-create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.user_profiles enable row level security;
alter table public.user_wallets enable row level security;
alter table public.user_wallet_transactions enable row level security;
alter table public.user_chat_sessions enable row level security;
alter table public.user_bookmarks enable row level security;

-- user_profiles policies
drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
  on public.user_profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- user_wallets policies
drop policy if exists "Users can view their own wallet" on public.user_wallets;
create policy "Users can view their own wallet"
  on public.user_wallets for select
  to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "Service role full access to wallets" on public.user_wallets;
create policy "Service role full access to wallets"
  on public.user_wallets for all
  using (true)
  with check (true);

-- user_wallet_transactions policies
drop policy if exists "Users can view their own transactions" on public.user_wallet_transactions;
create policy "Users can view their own transactions"
  on public.user_wallet_transactions for select
  to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists "Service role full access to transactions" on public.user_wallet_transactions;
create policy "Service role full access to transactions"
  on public.user_wallet_transactions for all
  using (true)
  with check (true);

-- user_chat_sessions policies
drop policy if exists "Users can manage their own chat sessions" on public.user_chat_sessions;
create policy "Users can manage their own chat sessions"
  on public.user_chat_sessions for all
  to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "Service role full access to chat sessions" on public.user_chat_sessions;
create policy "Service role full access to chat sessions"
  on public.user_chat_sessions for all
  using (true)
  with check (true);

-- user_bookmarks policies
drop policy if exists "Users can manage their own bookmarks" on public.user_bookmarks;
create policy "Users can manage their own bookmarks"
  on public.user_bookmarks for all
  to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists "Service role full access to bookmarks" on public.user_bookmarks;
create policy "Service role full access to bookmarks"
  on public.user_bookmarks for all
  using (true)
  with check (true);

-- =========================================================================
-- 9. Enable Realtime Publications for Wallets & Chat Sessions
-- =========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'user_wallets'
  ) then
    alter publication supabase_realtime add table public.user_wallets;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'user_chat_sessions'
  ) then
    alter publication supabase_realtime add table public.user_chat_sessions;
  end if;
exception
  when others then
    null; -- Silently pass if realtime publication is not configured
end;
$$;
