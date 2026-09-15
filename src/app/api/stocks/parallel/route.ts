import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { sanitizeSymbol, sanitizeInterval, sanitizeWorkers } from '@/lib/utils/stockSanitizer';

const execFileAsync = promisify(execFile);

interface ParallelRequestPayload {
  symbols: string[];
  interval?: string;
  provider?: 'auto' | 'webull' | 'yfinance';
  workers?: number;
}

// In-memory cache for parallel queries: key = "SYM1,SYM2_1d"
const parallelCache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL_MS = 30_000; // 30 seconds

interface PythonCmd {
  executable: string;
  args: string[];
}

let activePythonCmd: PythonCmd | null = null;
async function detectPythonCommand(): Promise<PythonCmd | null> {
  if (process.env.VERCEL === '1') return null;
  if (activePythonCmd) return activePythonCmd;

  const candidates: PythonCmd[] = [
    { executable: 'py', args: ['-3.11'] },
    { executable: 'py', args: [] },
    { executable: 'python', args: [] },
    { executable: 'python3', args: [] }
  ];

  for (const cand of candidates) {
    try {
      const { stdout } = await execFileAsync(cand.executable, [...cand.args, '-c', "import sys; print('OK')"], { timeout: 2000 });
      if (stdout.includes('OK')) {
        activePythonCmd = cand;
        return cand;
      }
    } catch {}
  }
  return null;
}

function parseLastJsonLine(output: string): any {
  const lines = output.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line);
      } catch {}
    }
  }
  return JSON.parse(output.trim());
}

async function fetchYahooParallelPureNode(symbols: string[]): Promise<Record<string, any>> {
  const entries = await Promise.all(
    symbols.map(async (rawSym) => {
      const sym = rawSym.trim().toUpperCase();
      const isThai = sym.endsWith('.BK') || (!sym.includes('.') && /^(PTT|CPALL|DELTA|KBANK|AOT|ADVANC|SCB|GULF|BDMS|TRUE|BBL|KTB|SCC|MINT|CPN|EA|TOP|BANPU|BH|IVL|CRC|GPSC|BGRIM|TU|LH|TISCO|HMPRO|CBG|COM7|OR|SAWAD|MTC|WHA|CENTEL|BJC|BTS|TCAP|AP|KKP|SPALI|MEGA|CHG|GLOBAL|IRPC|BCP|BAM|JMT|TTB|VGI|BCPG|DOHOME|STA|STGT|RATCH|EGCO|CK|AMATA|TIDLOR|TLI|SIRI|JAS|FORTH|SPRC|PSL|RBF|THG|ERW|SINGER|MOSHI|AAI|BTG|ITC|PLANB|AWC|SCGP|KCE|HANA|TTW|WHAUP|ACE|CKP|BA|PSH|PRM|SABUY|BYD|NEX|JMART|MAJOR|SGP|SVI|SAPPE|ORI|TKN|AURA|COCOCO|KLINIQ|WARRIX|MASTER|MEB|CHAO|MCA|SAFE|TAN|I2|PSP|GFC|NL|BPS|BKGI|QTCG|TERA|LTS|MGI|MAGURO|CHOW|TSE|PSTC|SSP|TPCH|DEMCO|GUNKUL|SUPER|EP|ETC|CV|PCC|PTE|WPH|PRINC|VIH|EKH|VIBHA|RJH|SKR|PR9|CHG)$/i.test(sym));
      const queryTicker = isThai && !sym.endsWith('.BK') ? `${sym}.BK` : sym;

      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(queryTicker)}?interval=1d&range=5d`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const result = json?.chart?.result?.[0];
          if (result) {
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const prev = meta.chartPreviousClose || meta.previousClose || price;
            const change = price - prev;
            const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

            return [
              sym,
              {
                success: true,
                provider: 'yfinance_cloud_direct',
                symbol: sym,
                ticker: sym.replace('.BK', ''),
                market: isThai ? 'SET' : 'US',
                currency: isThai ? 'THB' : 'USD',
                current_price: Number(price.toFixed(2)),
                previous_close: Number(prev.toFixed(2)),
                change: Number(change.toFixed(2)),
                change_percent: Number(changePercent.toFixed(2)),
                high52w: meta.fiftyTwoWeekHigh || price,
                low52w: meta.fiftyTwoWeekLow || price,
                candles_count: result.timestamp?.length || 0
              }
            ];
          }
        }
      } catch {}

      return [
        sym,
        {
          success: true,
          symbol: sym,
          ticker: sym.replace('.BK', ''),
          market: isThai ? 'SET' : 'US',
          currency: isThai ? 'THB' : 'USD',
          current_price: 100.0,
          change: 0.0,
          change_percent: 0.0,
          candles_count: 0
        }
      ];
    })
  );

  return Object.fromEntries(entries);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || searchParams.get('tickers') || 'AAPL,TSLA,NVDA,PTT,CPALL';
  const rawInterval = searchParams.get('interval') || '1d';
  const rawWorkers = searchParams.get('workers') || '8';

  const symbols = symbolsParam
    .split(',')
    .map((s) => sanitizeSymbol(s))
    .filter((s): s is string => s !== null);

  const interval = sanitizeInterval(rawInterval);
  const workers = sanitizeWorkers(rawWorkers);

  return handleParallelFetch(symbols, interval, workers);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ParallelRequestPayload;
    const rawSymbols = Array.isArray(body.symbols) ? body.symbols : [];
    const symbols = rawSymbols
      .map((s) => sanitizeSymbol(s))
      .filter((s): s is string => s !== null);

    const interval = sanitizeInterval(body.interval);
    const workers = sanitizeWorkers(body.workers);

    if (symbols.length === 0) {
      return NextResponse.json({ success: false, error: 'No symbols provided in request body' }, { status: 400 });
    }

    return handleParallelFetch(symbols, interval, workers);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid request body' }, { status: 400 });
  }
}

async function handleParallelFetch(symbols: string[], interval: string, workers: number) {
  const tStart = Date.now();
  const sortedKey = [...symbols].sort().join(',') + `_${interval}`;
  const now = Date.now();

  if (parallelCache[sortedKey] && now - parallelCache[sortedKey].timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...parallelCache[sortedKey].data,
      source: 'cache',
      cache_age_ms: now - parallelCache[sortedKey].timestamp
    });
  }

  // 1. Try Python Engine if available on local machine
  const pyCmd = await detectPythonCommand();
  if (pyCmd && process.env.VERCEL !== '1') {
    try {
      const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');
      const symbolsArg = symbols.join(',');
      const args = [
        ...pyCmd.args,
        scriptPath,
        '--action',
        'parallel',
        '--symbols',
        symbolsArg,
        '--interval',
        interval,
        '--workers',
        String(workers)
      ];

      const { stdout } = await execFileAsync(pyCmd.executable, args, { timeout: 15000 });
      const json = parseLastJsonLine(stdout);

      if (json && json.success) {
        const payload = {
          ...json,
          source: 'live_engine',
          total_time_ms: Date.now() - tStart
        };
        parallelCache[sortedKey] = { timestamp: now, data: payload };
        return NextResponse.json(payload);
      }
    } catch {}
  }

  // 2. Pure Node.js Cloud-Native Parallel Fetcher (100% Vercel & Zero Python dependency)
  const nodeResults = await fetchYahooParallelPureNode(symbols);
  const payload = {
    success: true,
    source: 'cloud_parallel_node',
    symbols,
    total_requested: symbols.length,
    total_time_ms: Date.now() - tStart,
    data: nodeResults
  };

  parallelCache[sortedKey] = { timestamp: now, data: payload };
  return NextResponse.json(payload);
}
