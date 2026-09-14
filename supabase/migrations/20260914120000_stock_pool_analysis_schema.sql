-- =========================================================================
-- StockHomeTH Supabase Migration: Stock Pool & Multi-Layer Analysis Schema
-- Migration: 20260914120000_stock_pool_analysis_schema.sql
-- (Idempotent: Safe to re-run multiple times)
-- =========================================================================

-- 1. Add Pool & Analysis Tracking Columns to public.stocks
alter table public.stocks 
  add column if not exists analysis_status text default 'pending' check (analysis_status in ('pending', 'completed', 'failed', 'processing')),
  add column if not exists last_fetched_at timestamptz default now(),
  add column if not exists last_analyzed_at timestamptz,
  add column if not exists analysis_payload jsonb default '{}'::jsonb,
  add column if not exists price_history_sample jsonb default '[]'::jsonb,
  add column if not exists technical_indicators jsonb default '{}'::jsonb;

-- 2. Create High-Performance Indexes for Batch Worker Queries
create index if not exists idx_stocks_analysis_status on public.stocks(analysis_status);
create index if not exists idx_stocks_last_fetched_at on public.stocks(last_fetched_at desc);
create index if not exists idx_stocks_status_market on public.stocks(analysis_status, market);
