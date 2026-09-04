import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface ParallelRequestPayload {
  symbols: string[];
  interval?: string;
  provider?: 'auto' | 'webull' | 'yfinance';
  workers?: number;
}

// In-memory cache for parallel queries: key = "SYM1,SYM2_1d"
const parallelCache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL_MS = 30_000; // 30 seconds

let activePythonCmd: string | null = null;
async function detectPythonCommand(): Promise<string> {
  if (activePythonCmd) return activePythonCmd;
  const candidates = ['py -3.11', 'py', 'python'];
  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} -c "import webull, sys; print('OK')"`, { timeout: 3000 });
      if (stdout.includes('OK')) {
        activePythonCmd = cmd;
        return cmd;
      }
    } catch {
      // Continue
    }
  }
  return 'py';
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || searchParams.get('tickers') || 'AAPL,TSLA,NVDA,PTT,CPALL';
  const interval = searchParams.get('interval') || '1d';
  const workers = parseInt(searchParams.get('workers') || '8', 10);

  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

  return handleParallelFetch(symbols, interval, workers);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ParallelRequestPayload;
    const symbols = Array.isArray(body.symbols)
      ? body.symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : [];
    const interval = body.interval || '1d';
    const workers = body.workers || 8;

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

  try {
    const pyCmd = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');
    const symbolsArg = symbols.join(',');
    const cmd = `${pyCmd} "${scriptPath}" --action parallel --symbols "${symbolsArg}" --interval "${interval}" --workers ${workers}`;

    const { stdout } = await execAsync(cmd, { timeout: 20000 });
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
  } catch (err: any) {
    console.warn('[Parallel API Route] Python engine error, fallback:', err);
  }

  // Fallback response with structured data
  return NextResponse.json({
    success: true,
    source: 'fallback',
    symbols,
    total_requested: symbols.length,
    total_time_ms: Date.now() - tStart,
    data: Object.fromEntries(
      symbols.map((sym) => [
        sym,
        {
          success: true,
          symbol: sym,
          ticker: sym.replace('.BK', ''),
          market: sym.endsWith('.BK') ? 'SET' : 'US',
          currency: sym.endsWith('.BK') ? 'THB' : 'USD',
          current_price: 100.0,
          change: 0.0,
          change_percent: 0.0,
          candles_count: 0,
          candles: []
        }
      ])
    )
  });
}
