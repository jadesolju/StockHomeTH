# Automatic market quote updates

The page polls visible data only while a browser has it open, and opening a
stock can fetch a live quote for that ticker alone. The protected
`/api/cron/sync` route already updates up to 50 oldest-updated stock rows per
call; this schedule makes that batch update run without opening any stock
pages.

## One-time setup

1. Deploy the app to its public production URL. A Supabase job cannot reach a
   local-only `localhost` server.
2. In Vercel, set `CRON_SECRET` to a random secret and set the Supabase server
   secret used by the cron route (`SUPABASE_SECRET_KEY` or
   `SUPABASE_SERVICE_ROLE_KEY`). Redeploy after changing environment variables.
3. In Supabase, enable `pg_cron` and `pg_net` under **Database → Extensions**.
4. In Supabase Vault, create these named secrets:
   - `market_sync_url`: `https://<production-domain>/api/cron/sync?limit=50`
   - `market_sync_cron_secret`: the exact same value as Vercel's
     `CRON_SECRET`
5. Run [`market_quote_sync.sql`](./market_quote_sync.sql) once in the Supabase
   SQL Editor.

The job calls the server route every five minutes during weekday windows that
cover SET trading hours and both US daylight-saving offsets. The route itself
skips work when neither market is open. Each run refreshes the 50 oldest rows,
so the whole stored universe rotates through automatically over successive
market sessions. The browser's existing polling remains useful for refreshing
the open page; the database update now runs independently of browser sessions.

## Check that it is running

In Supabase SQL Editor:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'stockhome-market-quotes';

select status_code, content, error_msg, created
from net._http_response
order by created desc
limit 20;
```

`status_code` 200 and response content with `"success":true` indicate the
route accepted the sync request. The route also returns `count` and
`timestamp`. If the secret or production URL changes, update the matching Vault
secret too.

To disable the scheduler:

```sql
select cron.unschedule(jobid)
from cron.job
where jobname = 'stockhome-market-quotes';
```
