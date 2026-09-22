<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# StockHomeTH Agent Development Guidelines & System Blueprints

## 1. Storage & Zero-Egress Architecture
- **Cloudflare R2 for Large JSON Payloads**: Store market universes (`market/universe.json`), weekly news digests (`news/weekly_digest.json`), and rich AI analysis documents (`ai/analysis/{ticker}.json`) on Cloudflare R2 ($0.00 Egress fee).
- **Supabase for Relational & Metadata**: Use Supabase Postgres for authentication, user profiles, wallet transactions, bookmarks, and lightweight projections. **Never use unprojected `select('*')` on large tables.**
- **Two-Way Sync Engine**: Use `src/lib/services/r2DataSyncService.ts` for synchronizing and offloading data between Supabase, local storage, and R2.

---

## 2. LINE & Telegram Market Digest & Signal Engine (Blueprint)
Refer to [.agents/skills/line-telegram-digest-bot/SKILL.md](file:///c:/Users/ASUS/.gemini/antigravity-ide/scratch/stock-news-app/.agents/skills/line-telegram-digest-bot/SKILL.md) for full implementation details.

### Key Rules & Constraints:
1. **Centralized 1-Call Summarization**: Generate central digest summaries **once per category per round** (08:00 & 18:00 TH), store in R2/Supabase, and dispatch copies to matching subscribers. Never call AI per individual subscriber.
2. **Deterministic / Rule-Based Signals**: Stock/Gold signals must be calculated using clear mathematical rules (e.g. price % change, volume spikes, breakout levels), never hallucinated by LLMs.
3. **Multi-Channel Delivery Quotas**:
   - **LINE OA**: Use single unified **Flex Message** bubbles to keep quota count to 1 push/subscriber/round. Handle Webhook events (`follow`, `unfollow`, `message`).
   - **Telegram Bot**: Comply with Telegram Bot API rate limits (max 30 messages/second globally, max 1 message/second to the same chat).
4. **Member Linkage**: Allow members to link LINE and Telegram accounts using a one-time secure code without mandatory phone number collection.
5. **Admin Review First**: During trial phases, summaries must enter `draft` status for admin inspection and approval before broadcasting.

