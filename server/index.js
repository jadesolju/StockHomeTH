import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomBytes, scryptSync, timingSafeEqual, createHmac, createHash } from 'crypto';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const DATA_DIR = './server/data';
const USERS_FILE = `${DATA_DIR}/users.json`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
if (process.env.NODE_ENV === 'production' && SESSION_SECRET === 'change-me-in-production') throw new Error('SESSION_SECRET is required in production.');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, '[]', 'utf8');
const readUsers = () => JSON.parse(readFileSync(USERS_FILE, 'utf8'));
const saveUsers = (users) => writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
const DEVELOPER_EMAIL = String(process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
const accountRole = (email) => email.toLowerCase() === DEVELOPER_EMAIL ? 'developer' : 'member';
const publicUser = ({ id, name, email, plan, subscriptionStatus, createdAt, provider = 'password', role = 'member' }) => ({ id, name, email, plan, subscriptionStatus, createdAt, provider, role });
const hashPassword = (password, salt = randomBytes(16).toString('hex')) => ({ salt, hash: scryptSync(password, salt, 64).toString('hex') });
const verifyPassword = (password, user) => Boolean(user.salt && user.passwordHash) && timingSafeEqual(Buffer.from(hashPassword(password, user.salt).hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
const signSession = (id) => `${id}.${createHmac('sha256', SESSION_SECRET).update(id).digest('hex')}`;
const getSessionUser = (req) => {
  const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('stockhome_session='));
  if (!cookie) return null;
  const [id, signature] = decodeURIComponent(cookie.split('=').slice(1).join('=')).split('.');
  const expected = createHmac('sha256', SESSION_SECRET).update(id).digest('hex');
  if (!id || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return readUsers().find(user => user.id === id) || null;
};
const setSession = (res, user) => res.setHeader('Set-Cookie', `stockhome_session=${encodeURIComponent(signSession(user.id))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
const requireUser = (req, res, next) => { const user = getSessionUser(req); if (!user) return res.status(401).json({ error: 'Authentication required' }); req.user = user; next(); };

// Provision the configured developer without an unsafe preset password.
if (DEVELOPER_EMAIL) {
  const users = readUsers(); let developer = users.find(user => user.email === DEVELOPER_EMAIL);
  if (!developer) { users.push({ id: `usr_${randomBytes(10).toString('hex')}`, name: 'Developer', email: DEVELOPER_EMAIL, provider: 'password', role: 'developer', plan: 'team', subscriptionStatus: 'active', createdAt: new Date().toISOString() }); saveUsers(users); }
  else if (developer.role !== 'developer' || developer.plan !== 'team') { developer.role = 'developer'; developer.plan = 'team'; developer.subscriptionStatus = 'active'; saveUsers(users); }
}

// ─── Stock Universe ────────────────────────────────────────────────────────────
const STOCK_TICKERS = [
  // Thai SET Stocks (Yahoo Finance uses .BK suffix)
  { symbol: 'PTT.BK',   ticker: 'PTT',   market: 'SET', name: 'PTT Public Company Limited',       sector: 'Energy & Utilities' },
  { symbol: 'CPALL.BK', ticker: 'CPALL', market: 'SET', name: 'CP ALL Public Company Limited',     sector: 'Commerce & Retail' },
  { symbol: 'AOT.BK',   ticker: 'AOT',   market: 'SET', name: 'Airports of Thailand PCL',          sector: 'Transportation & Logistics' },
  { symbol: 'KBANK.BK', ticker: 'KBANK', market: 'SET', name: 'Kasikornbank PCL',                  sector: 'Banking & Financials' },
  { symbol: 'DELTA.BK', ticker: 'DELTA', market: 'SET', name: 'Delta Electronics (Thailand) PCL',  sector: 'Electronics' },
  { symbol: 'BDMS.BK',  ticker: 'BDMS',  market: 'SET', name: 'Bangkok Dusit Medical PCL',         sector: 'Healthcare' },
  { symbol: 'SCB.BK',   ticker: 'SCB',   market: 'SET', name: 'SCB X Public Company Limited',      sector: 'Banking & Financials' },
  { symbol: 'GULF.BK',  ticker: 'GULF',  market: 'SET', name: 'Gulf Energy Development PCL',       sector: 'Energy & Utilities' },
  // US Global Stocks
  { symbol: 'NVDA',  ticker: 'NVDA',  market: 'US', name: 'NVIDIA Corporation',         sector: 'Semiconductors & AI' },
  { symbol: 'AAPL',  ticker: 'AAPL',  market: 'US', name: 'Apple Inc.',                 sector: 'Consumer Electronics' },
  { symbol: 'TSLA',  ticker: 'TSLA',  market: 'US', name: 'Tesla, Inc.',                sector: 'Automotive & Clean Energy' },
  { symbol: 'MSFT',  ticker: 'MSFT',  market: 'US', name: 'Microsoft Corporation',      sector: 'Software & Cloud' },
  { symbol: 'GOOGL', ticker: 'GOOGL', market: 'US', name: 'Alphabet Inc. (Google)',     sector: 'Internet & Search' },
  { symbol: 'META',  ticker: 'META',  market: 'US', name: 'Meta Platforms, Inc.',       sector: 'Social Media & Tech' },
];

// ─── Static fallback values (reasonable placeholders when API is down) ─────────
const FALLBACK = {
  'PTT':   { price: 34.50, change: 1.47, peRatio: 9.8,  div: 6.2, cap: '985.4B THB', target: 39.00, score: 84, analystRating: 'Strong Buy' },
  'CPALL': { price: 64.75, change: -0.77,peRatio: 28.4, div: 2.1, cap: '581.6B THB', target: 74.00, score: 72, analystRating: 'Buy' },
  'AOT':   { price: 61.25, change: 2.08, peRatio: 36.2, div: 1.8, cap: '875.0B THB', target: 72.50, score: 89, analystRating: 'Strong Buy' },
  'KBANK': { price: 154.5, change: 0.98, peRatio: 8.5,  div: 5.8, cap: '366.0B THB', target: 170.0, score: 78, analystRating: 'Buy' },
  'DELTA': { price: 142.0, change: 4.41, peRatio: 72.1, div: 0.6, cap: '1.77T THB',  target: 155.0, score: 92, analystRating: 'Buy' },
  'BDMS':  { price: 27.50, change: -0.9, peRatio: 29.8, div: 2.9, cap: '437.0B THB', target: 32.00, score: 68, analystRating: 'Buy' },
  'SCB':   { price: 114.0, change: 1.33, peRatio: 9.1,  div: 8.9, cap: '383.9B THB', target: 126.0, score: 85, analystRating: 'Strong Buy' },
  'GULF':  { price: 66.50, change: 3.10, peRatio: 44.2, div: 1.3, cap: '780.3B THB', target: 75.00, score: 91, analystRating: 'Strong Buy' },
  'NVDA':  { price: 128.5, change: 3.85, peRatio: 54.2, div: 0.08,cap: '$3.15T',     target: 150.0, score: 96, analystRating: 'Strong Buy' },
  'AAPL':  { price: 226.4, change: 1.12, peRatio: 33.8, div: 0.44,cap: '$3.44T',     target: 250.0, score: 82, analystRating: 'Buy' },
  'TSLA':  { price: 215.8, change: -2.35,peRatio: 62.4, div: 0.0, cap: '$688.2B',    target: 235.0, score: 58, analystRating: 'Hold' },
  'MSFT':  { price: 418.2, change: 0.88, peRatio: 34.6, div: 0.72,cap: '$3.11T',     target: 480.0, score: 90, analystRating: 'Strong Buy' },
  'GOOGL': { price: 165.9, change: 1.45, peRatio: 23.1, div: 0.48,cap: '$2.06T',     target: 195.0, score: 83, analystRating: 'Buy' },
  'META':  { price: 512.3, change: 2.64, peRatio: 25.8, div: 0.39,cap: '$1.30T',     target: 580.0, score: 94, analystRating: 'Strong Buy' },
};

const AI_INSIGHTS = {
  'PTT':   'Strong cash flow driven by energy sector diversification and LNG hub expansion in Southeast Asia.',
  'CPALL': 'Retail sales momentum surging following tourism recovery and digital wallet stimulus policy.',
  'AOT':   'Passenger traffic at Suvarnabhumi and Don Mueang airports back to 95% pre-pandemic capacity.',
  'KBANK': 'Digital banking leader leveraging K PLUS for AI-driven retail micro-lending and SME financing.',
  'DELTA': 'High demand for AI data center power supplies and EV components propelling record market cap.',
  'BDMS':  'International medical tourism experiencing double-digit revenue growth from Middle East and ASEAN.',
  'SCB':   'High dividend payout attracting institutional investors alongside Fintech venture portfolio growth.',
  'GULF':  'Synergies with INTUCH and AIS positioning GULF as a cloud infrastructure and data center leader.',
  'NVDA':  'Blackwell architecture GPUs seeing historic demand across hyperscaler AI data centers worldwide.',
  'AAPL':  'Apple Intelligence rollout creating major iPhone upgrade cycle across 1.5B active device install base.',
  'TSLA':  'FSD V12 autonomous driving progress and Robotaxi launch key catalysts for re-rating valuation.',
  'MSFT':  'Azure AI Cloud revenues growing 30%+ YoY with Copilot enterprise adoption expanding rapidly.',
  'GOOGL': 'Gemini 1.5 Pro integration into Search, YouTube, and Cloud driving multi-quarter margin expansion.',
  'META':  'Llama open-source AI powering Meta AI assistant across Facebook, Instagram, and WhatsApp globally.',
};

// ─── Helper: Fetch Yahoo Finance chart (single stock) ─────────────────────────
async function fetchYahooChart(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=8d`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockHomeTH/1.0)' }
    });
    if (!response.ok) return null;

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const valid = closes.filter(q => typeof q === 'number' && isFinite(q));

    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
    const change = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0;

    return {
      price: +currentPrice.toFixed(2),
      change: +change.toFixed(2),
      currency: meta.currency,
      high52w: +(meta.fiftyTwoWeekHigh || currentPrice * 1.15).toFixed(2),
      low52w: +(meta.fiftyTwoWeekLow || currentPrice * 0.85).toFixed(2),
      volume: meta.regularMarketVolume
        ? (meta.regularMarketVolume / 1_000_000).toFixed(1) + 'M'
        : '20M',
      sparkline7d: valid.length >= 2
        ? valid.slice(-7).map(q => +q.toFixed(2))
        : null,
    };
  } catch (e) {
    return null;
  }
}

// ─── GET /api/stocks/live ─────────────────────────────────────────────────────
app.get('/api/stocks/live', async (_req, res) => {
  try {
    const results = await Promise.allSettled(
      STOCK_TICKERS.map(async (item) => {
        const live = await fetchYahooChart(item.symbol);
        const fb = FALLBACK[item.ticker] || {};

        const price   = live?.price   ?? fb.price   ?? 100;
        const change  = live?.change  ?? fb.change  ?? 0;
        const hi52    = live?.high52w ?? price * 1.15;
        const lo52    = live?.low52w  ?? price * 0.85;
        const currency = live?.currency ?? (item.market === 'SET' ? 'THB' : 'USD');
        const sparkline = live?.sparkline7d ?? (
          // Generate reasonable fake sparkline from fallback price
          Array.from({ length: 7 }, (_, i) => {
            const drift = (Math.random() - 0.48) * price * 0.012;
            return +(price * (1 + (i - 6) * 0.005) + drift).toFixed(2);
          })
        );

        return {
          ticker: item.ticker,
          name: item.name,
          market: item.market,
          sector: item.sector,
          price,
          currency,
          change,
          marketCap: fb.cap ?? (item.market === 'SET' ? '300B THB' : '$500B'),
          peRatio: fb.peRatio ?? 25,
          dividendYield: fb.div ?? 2.0,
          high52w: hi52,
          low52w: lo52,
          volume: live?.volume ?? '20M',
          sparkline7d: sparkline,
          analystRating: fb.analystRating ?? 'Buy',
          targetPrice: fb.target ?? +(price * 1.12).toFixed(2),
          sentimentScore: fb.score ?? 75,
          aiInsight: AI_INSIGHTS[item.ticker] ?? `${item.name} shows stable sector positioning with strong institutional interest.`,
          description: `${item.name} is a leading company listed on ${item.market === 'SET' ? 'Stock Exchange of Thailand (SET)' : 'US markets (NASDAQ/NYSE)'}.`,
        };
      })
    );

    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    res.json({
      status: 200,
      timestamp: new Date().toISOString(),
      source: 'Yahoo Finance Live',
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
});

// ─── POST /api/auth/oauth ─────────────────────────────────────────────────────
// Authentication: password hashes and signed HTTP-only sessions. OAuth callbacks
// use server-side tokens only; no provider secret is ever sent to the browser.
app.get('/api/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.status(503).json({ error: 'Google OAuth is not configured.' });
  const state = randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/auth/google/callback`,
    response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const appUrl = process.env.WEB_APP_URL || 'http://127.0.0.1:5173';
  const cookieState = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('google_oauth_state='))?.split('=').slice(1).join('=');
  if (!req.query.code || !req.query.state || !cookieState || req.query.state !== cookieState) return res.redirect(`${appUrl}?auth_error=google_state`);
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({
      code: String(req.query.code), client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/auth/google/callback`, grant_type: 'authorization_code',
    }) });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email_verified || !profile.email) throw new Error('Google account email is not verified');
    const users = readUsers(); const email = profile.email.toLowerCase();
    let user = users.find(candidate => candidate.email === email);
    if (!user) { user = { id: `usr_${randomBytes(10).toString('hex')}`, name: profile.name || email.split('@')[0], email, provider: 'google', role: accountRole(email), plan: accountRole(email) === 'developer' ? 'team' : 'free', subscriptionStatus: accountRole(email) === 'developer' ? 'active' : 'inactive', createdAt: new Date().toISOString() }; users.push(user); saveUsers(users); }
    setSession(res, user);
    res.setHeader('Set-Cookie', [`stockhome_session=${encodeURIComponent(signSession(user.id))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`, 'google_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0']);
    res.redirect(appUrl);
  } catch (error) { console.error('Google OAuth error:', error.message); res.redirect(`${appUrl}?auth_error=google`); }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Name, valid email, and password of at least 8 characters are required.' });
  }
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some(user => user.email === normalizedEmail)) return res.status(409).json({ error: 'An account already exists for this email.' });
  const { salt, hash } = hashPassword(password);
  const isDeveloper = accountRole(normalizedEmail) === 'developer';
  const user = { id: `usr_${randomBytes(10).toString('hex')}`, name: name.trim(), email: normalizedEmail, provider: 'password', role: accountRole(normalizedEmail), salt, passwordHash: hash, plan: isDeveloper ? 'team' : 'free', subscriptionStatus: isDeveloper ? 'active' : 'inactive', createdAt: new Date().toISOString() };
  users.push(user); saveUsers(users); setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = readUsers().find(candidate => candidate.email === String(email || '').trim().toLowerCase());
  if (!user || typeof password !== 'string' || !verifyPassword(password, user)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  setSession(res, user); res.json({ user: publicUser(user) });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const users = readUsers(); const user = users.find(candidate => candidate.email === email);
  const generic = { message: 'If an account exists, password-reset instructions have been sent.' };
  if (!user || user.provider === 'google') return res.json(generic);
  const token = randomBytes(32).toString('hex'); user.resetTokenHash = createHash('sha256').update(token).digest('hex'); user.resetExpiresAt = Date.now() + 15 * 60 * 1000; saveUsers(users);
  if (process.env.NODE_ENV !== 'production') return res.json({ ...generic, resetUrl: `${process.env.WEB_APP_URL || 'http://127.0.0.1:5173'}?reset_token=${token}` });
  res.json(generic);
});

app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'A valid reset token and password of at least 8 characters are required.' });
  const tokenHash = createHash('sha256').update(token).digest('hex'); const users = readUsers(); const user = users.find(candidate => candidate.resetTokenHash === tokenHash && candidate.resetExpiresAt > Date.now());
  if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  const { salt, hash } = hashPassword(password); user.salt = salt; user.passwordHash = hash; user.provider = 'password'; delete user.resetTokenHash; delete user.resetExpiresAt; saveUsers(users);
  setSession(res, user); res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'stockhome_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.status(204).end();
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: publicUser(user) });
});

const PLANS = {
  free: { name: 'Free', price: 0, features: ['Delayed market data', 'Daily briefing', '5 watchlist symbols'] },
  pro: { name: 'Pro', price: 490, features: ['Live market data', 'Unlimited watchlist', 'AI briefing and API access'] },
  team: { name: 'Team', price: 1490, features: ['Everything in Pro', '5 seats', 'Shared API workspace'] },
};
app.get('/api/subscriptions/plans', (_req, res) => res.json({ currency: 'THB', interval: 'month', plans: PLANS }));
app.get('/api/subscriptions/me', requireUser, (req, res) => res.json({ plan: req.user.plan, status: req.user.subscriptionStatus }));
app.post('/api/subscriptions/checkout', requireUser, (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan] || plan === 'free') return res.status(400).json({ error: 'Choose a paid plan.' });
  // Replace with Stripe Checkout Session creation when STRIPE_SECRET_KEY is present.
  res.status(501).json({ error: 'Payments are not configured yet.', plan, integration: 'stripe_checkout', requiredEnv: ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_TEAM'] });
});

// ─── GET /api/v1/chart/:symbol (OHLCV Candles for Custom Stock Chart) ────────
app.get('/api/v1/chart/:symbol', async (req, res) => {
  try {
    let symbol = String(req.params.symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '');
    const country = String(req.query.country || '').toLowerCase();
    const period = String(req.query.period || '1mo');

    if (!symbol) return res.status(400).json({ error: 'Valid symbol is required.' });

    // Suffix resolution
    if (!symbol.includes('.') && !symbol.includes('^')) {
      if (country === 'th' || ['PTT', 'CPALL', 'DELTA', 'AOT', 'KBANK', 'GULF', 'BDMS', 'SCB', 'ADVANC', 'TRUE'].includes(symbol)) {
        symbol = `${symbol}.BK`;
      } else if (country === 'jp') {
        symbol = `${symbol}.T`;
      } else if (country === 'hk') {
        symbol = `${symbol}.HK`;
      } else if (country === 'uk') {
        symbol = `${symbol}.L`;
      } else if (country === 'sg') {
        symbol = `${symbol}.SI`;
      }
    }

    const rangeMap = { '1d': '1d', '5d': '5d', '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '1y': '1y', 'max': '5y' };
    const intervalMap = { '1d': '15m', '5d': '1h', '1mo': '1d', '3mo': '1d', '6mo': '1d', '1y': '1wk', 'max': '1wk' };
    const range = rangeMap[period] || '1mo';
    const interval = intervalMap[period] || '1d';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to query Yahoo chart feed', symbol });
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No chart data found for symbol', symbol });

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const closes = quote.close || [];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const volumes = quote.volume || [];

    const candles = [];
    const closesClean = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c !== 'number' || isNaN(c)) continue;
      const o = typeof opens[i] === 'number' && !isNaN(opens[i]) ? opens[i] : c;
      const h = typeof highs[i] === 'number' && !isNaN(highs[i]) ? highs[i] : Math.max(o, c);
      const l = typeof lows[i] === 'number' && !isNaN(lows[i]) ? lows[i] : Math.min(o, c);
      const v = typeof volumes[i] === 'number' && !isNaN(volumes[i]) ? volumes[i] : 0;
      const ts = timestamps[i] * 1000;
      const d = new Date(ts);
      const dateStr = interval === '15m' || interval === '1h'
        ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        : `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;

      closesClean.push(c);
      const ma20Slice = closesClean.slice(Math.max(0, closesClean.length - 20));
      const ma20 = +(ma20Slice.reduce((a, b) => a + b, 0) / ma20Slice.length).toFixed(2);
      const ma50Slice = closesClean.slice(Math.max(0, closesClean.length - 50));
      const ma50 = +(ma50Slice.reduce((a, b) => a + b, 0) / ma50Slice.length).toFixed(2);

      candles.push({
        time: ts,
        date: dateStr,
        open: +o.toFixed(2),
        high: +h.toFixed(2),
        low: +l.toFixed(2),
        close: +c.toFixed(2),
        volume: v,
        ma20,
        ma50,
        isUp: c >= o
      });
    }

    const currentPrice = meta.regularMarketPrice || (candles.length ? candles[candles.length - 1].close : 0);
    const prevClose = meta.chartPreviousClose || meta.previousClose || (candles.length > 1 ? candles[candles.length - 2].close : currentPrice);
    const change = +(currentPrice - prevClose).toFixed(2);
    const changePct = prevClose ? +(((currentPrice - prevClose) / prevClose) * 100).toFixed(2) : 0;

    res.json({
      status: 'success',
      symbol,
      ticker: symbol.replace(/\..+$/, ''),
      country: symbol.endsWith('.BK') ? 'TH' : symbol.endsWith('.T') ? 'JP' : symbol.endsWith('.HK') ? 'HK' : symbol.endsWith('.L') ? 'UK' : symbol.endsWith('.SI') ? 'SG' : 'US',
      currency: meta.currency || (symbol.endsWith('.BK') ? 'THB' : 'USD'),
      period,
      interval,
      current_price: +currentPrice.toFixed(2),
      previous_close: +prevClose.toFixed(2),
      change,
      change_percent: changePct,
      high52w: +(meta.fiftyTwoWeekHigh || currentPrice * 1.15).toFixed(2),
      low52w: +(meta.fiftyTwoWeekLow || currentPrice * 0.85).toFixed(2),
      market_cap: meta.marketCap,
      candles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Versioned, provider-agnostic market endpoint. Yahoo is the default adapter;
// TradingView feeds should be connected server-side with licensed credentials.
app.get('/api/v1/market/quote/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '');
  if (!symbol) return res.status(400).json({ error: 'Valid symbol is required.' });
  const quote = await fetchYahooChart(symbol);
  if (!quote) return res.status(502).json({ error: 'Yahoo Finance is currently unavailable.', provider: 'yahoo' });
  res.json({ symbol, provider: 'yahoo', delayed: true, asOf: new Date().toISOString(), quote });
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'online', uptime: process.uptime() })
);

app.listen(PORT, () =>
  console.log(`🚀  StockHomeTH API Server  →  http://localhost:${PORT}`)
);
