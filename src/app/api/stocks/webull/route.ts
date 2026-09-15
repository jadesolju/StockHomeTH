import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

interface PythonConfig {
  executable: string;
  prefixArgs: string[];
}

let activePythonConfig: PythonConfig | null = null;

async function detectPythonCommand(): Promise<PythonConfig> {
  if (activePythonConfig) return activePythonConfig;
  const candidates: PythonConfig[] = [
    { executable: 'py', prefixArgs: ['-3.11'] },
    { executable: 'py', prefixArgs: [] },
    { executable: 'python', prefixArgs: [] },
    { executable: 'python3', prefixArgs: [] },
  ];

  for (const config of candidates) {
    try {
      const { stdout } = await execFileAsync(
        config.executable,
        [...config.prefixArgs, '-c', "import webull, sys; print('OK')"],
        { timeout: 3000 }
      );
      if (stdout.includes('OK')) {
        activePythonConfig = config;
        return config;
      }
    } catch {}
  }
  const defaultConfig: PythonConfig = { executable: 'py', prefixArgs: [] };
  activePythonConfig = defaultConfig;
  return defaultConfig;
}

const ALLOWED_ACTIONS = new Set(['status', 'quote', 'bars', 'batch_bars', 'parallel']);
const ALLOWED_INTERVALS = new Set([
  '1m', '2m', '5m', '15m', '30m', '60m', '90m',
  '1h', '2h', '4h', '1d', '5d', '1wk', '1mo', '3mo'
]);

function sanitizeAction(action: unknown, fallback: string): string {
  if (typeof action === 'string' && ALLOWED_ACTIONS.has(action)) {
    return action;
  }
  return fallback;
}

function sanitizeInterval(interval: unknown): string {
  if (typeof interval === 'string' && ALLOWED_INTERVALS.has(interval)) {
    return interval;
  }
  return '1d';
}

function sanitizeSymbolString(symbolStr: unknown, fallback: string): string {
  if (typeof symbolStr !== 'string') return fallback;
  const cleaned = symbolStr.replace(/[^A-Za-z0-9.,_-]/g, '').trim();
  return cleaned || fallback;
}

function sanitizeCredential(cred: unknown): string {
  if (typeof cred !== 'string') return '';
  return cred.replace(/[\r\n\0]/g, '').trim();
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
  const action = sanitizeAction(searchParams.get('action'), 'status');
  const symbol = sanitizeSymbolString(searchParams.get('symbol'), 'AAPL');
  const symbols = sanitizeSymbolString(searchParams.get('symbols'), 'AAPL,TSLA,NVDA');
  const interval = sanitizeInterval(searchParams.get('interval'));

  try {
    const pyConfig = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args: string[] = [...pyConfig.prefixArgs, scriptPath, '--action', action];

    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', symbol, '--interval', interval);
    } else if (action === 'batch_bars' || action === 'parallel') {
      args.push('--symbols', symbols, '--interval', interval);
    }

    const { stdout } = await execFileAsync(pyConfig.executable, args, { timeout: 20000 });
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
    const action = sanitizeAction(body.action, 'batch_bars');
    const rawSymbols = Array.isArray(body.symbols) ? body.symbols.join(',') : body.symbols;
    const symbols = sanitizeSymbolString(rawSymbols, 'AAPL,TSLA');
    const symbol = sanitizeSymbolString(body.symbol, 'AAPL');
    const interval = body.interval ? sanitizeInterval(body.interval) : '1d';
    const appKey = sanitizeCredential(body.appKey);
    const appSecret = sanitizeCredential(body.appSecret);

    const pyConfig = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args: string[] = [...pyConfig.prefixArgs, scriptPath, '--action', action];

    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', symbol, '--interval', interval);
    } else {
      args.push('--symbols', symbols, '--interval', interval);
    }

    if (appKey) args.push('--app_key', appKey);
    if (appSecret) args.push('--app_secret', appSecret);

    const { stdout } = await execFileAsync(pyConfig.executable, args, { timeout: 25000 });
    const json = parseLastJsonLine(stdout);
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webull POST execution error' },
      { status: 500 }
    );
  }
}
