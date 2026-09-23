-- Call the existing protected stock quote sync route from Supabase Cron.
-- Before running this script:
--   1. Enable pg_cron and pg_net in Supabase Database > Extensions.
--   2. Add these two secrets in Supabase Vault:
--        market_sync_url = https://<production-domain>/api/cron/sync?limit=50
--        market_sync_cron_secret = the same value as Vercel's CRON_SECRET
--   3. Ensure Vercel has CRON_SECRET and a Supabase server secret configured.
--
-- Schedule uses UTC (Supabase's default database timezone). The endpoint also
-- checks whether SET or US market hours are active, so the wider US window
-- covers both daylight-saving offsets without requiring schedule edits.

-- Replace an earlier copy if this setup is run again.
select cron.unschedule(jobid)
from cron.job
where jobname = 'stockhome-market-quotes';

select cron.schedule(
  'stockhome-market-quotes',
  '*/5 3-5,7-9,13-21 * * 1-5',
  $job$
    select net.http_get(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'market_sync_url'
      ),
      headers := jsonb_build_object(
        'authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'market_sync_cron_secret'
        )
      ),
      timeout_milliseconds := 10000
    );
  $job$
);

-- Verify the recurring job was registered.
select jobid, jobname, schedule, active
from cron.job
where jobname = 'stockhome-market-quotes';

