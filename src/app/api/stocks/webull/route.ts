import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

interface PythonRunner {
  file: string;
  args: string[];
}

let activePythonRunner: PythonRunner | null = null;

async function detectPythonRunner(): Promise<PythonRunner> {
  if (activePythonRunner) return activePythonRunner;

  const candidates: PythonRunner[] = [
    { file: 'python3', args: [] },
    { file: 'py', args: ['-3.11'] },
    { file: 'py', args: [] },
    { file: 'python', args: [] },
  ];

  for (const candidate of candidates) {
    try {
      const { stdout } = await execFileAsync(
        candidate.file,
        [...candidate.args, '-c', "import webull, sys; print('OK')"],
        { timeout: 3000 }
      );
      if (stdout.includes('OK')) {
        activePythonRunner = candidate;
        return candidate;
      }
    } catch {}
  }

  activePythonRunner = { file: 'python3', args: [] };
  return activePythonRunner;
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

const ALLOWED_ACTIONS = new Set(['status', 'bars', 'quote', 'batch_bars', 'parallel', 'account', 'orders']);
const ALLOWED_INTERVALS = new Set(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1wk', '1mo']);
const SAFE_SYMBOL_REGEX = /^[A-Za-z0-9._^\-]{1,20}$/;
const SAFE_SYMBOLS_REGEX = /^[A-Za-z0-9._^\-, ]{1,500}$/;
const SAFE_KEY_SECRET_REGEX = /^[A-Za-z0-9_\-]{0,128}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const symbol = searchParams.get('symbol') || 'AAPL';
  const symbols = searchParams.get('symbols') || 'AAPL,TSLA,NVDA';
  const interval = searchParams.get('interval') || '1d';

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  }

  if (!SAFE_SYMBOL_REGEX.test(symbol)) {
    return NextResponse.json({ success: false, error: 'Invalid symbol parameter' }, { status: 400 });
  }

  if (!SAFE_SYMBOLS_REGEX.test(symbols)) {
    return NextResponse.json({ success: false, error: 'Invalid symbols parameter' }, { status: 400 });
  }

  if (!ALLOWED_INTERVALS.has(interval)) {
    return NextResponse.json({ success: false, error: 'Invalid interval parameter' }, { status: 400 });
  }

  try {
    const runner = await detectPythonRunner();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args = [...runner.args, scriptPath, '--action', action];
    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', symbol, '--interval', interval);
    } else if (action === 'batch_bars' || action === 'parallel') {
      args.push('--symbols', symbols, '--interval', interval);
    }

    const { stdout } = await execFileAsync(runner.file, args, { timeout: 20000 });
    const json = parseLastJsonLine(stdout);
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to execute Webull API engine',
        action,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'batch_bars';
    const symbols = Array.isArray(body.symbols) ? body.symbols.join(',') : (body.symbols || 'AAPL,TSLA');
    const symbol = body.symbol || 'AAPL';
    const interval = body.interval || '1d';
    const appKey = body.appKey || '';
    const appSecret = body.appSecret || '';

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
    }

    if (!SAFE_SYMBOL_REGEX.test(symbol)) {
      return NextResponse.json({ success: false, error: 'Invalid symbol parameter' }, { status: 400 });
    }

    if (!SAFE_SYMBOLS_REGEX.test(symbols)) {
      return NextResponse.json({ success: false, error: 'Invalid symbols parameter' }, { status: 400 });
    }

    if (!ALLOWED_INTERVALS.has(interval)) {
      return NextResponse.json({ success: false, error: 'Invalid interval parameter' }, { status: 400 });
    }

    if (!SAFE_KEY_SECRET_REGEX.test(appKey) || !SAFE_KEY_SECRET_REGEX.test(appSecret)) {
      return NextResponse.json({ success: false, error: 'Invalid appKey or appSecret parameter' }, { status: 400 });
    }

    const runner = await detectPythonRunner();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args = [...runner.args, scriptPath, '--action', action];
    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', symbol, '--interval', interval);
    } else {
      args.push('--symbols', symbols, '--interval', interval);
    }

    if (appKey) args.push('--app_key', appKey);
    if (appSecret) args.push('--app_secret', appSecret);

    const { stdout } = await execFileAsync(runner.file, args, { timeout: 25000 });
    const json = parseLastJsonLine(stdout);
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webull POST execution error' },
      { status: 500 }
    );
  }
}
