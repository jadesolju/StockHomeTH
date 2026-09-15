import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

interface PythonCmdConfig {
  command: string;
  argsPrefix: string[];
}

let activePythonCmd: PythonCmdConfig | null = null;

async function detectPythonCommand(): Promise<PythonCmdConfig> {
  if (activePythonCmd) return activePythonCmd;
  const candidates: PythonCmdConfig[] = [
    { command: 'py', argsPrefix: ['-3.11'] },
    { command: 'py', argsPrefix: [] },
    { command: 'python3', argsPrefix: [] },
    { command: 'python', argsPrefix: [] },
  ];
  for (const cand of candidates) {
    try {
      const { stdout } = await execFileAsync(cand.command, [...cand.argsPrefix, '-c', "import webull, sys; print('OK')"], { timeout: 3000 });
      if (stdout.includes('OK')) {
        activePythonCmd = cand;
        return cand;
      }
    } catch {}
  }
  activePythonCmd = { command: 'py', argsPrefix: [] };
  return activePythonCmd;
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
  const action = searchParams.get('action') || 'status';
  const symbol = searchParams.get('symbol') || 'AAPL';
  const symbols = searchParams.get('symbols') || 'AAPL,TSLA,NVDA';
  const interval = searchParams.get('interval') || '1d';

  try {
    const { command, argsPrefix } = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args = [...argsPrefix, scriptPath, '--action', String(action)];
    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', String(symbol), '--interval', String(interval));
    } else if (action === 'batch_bars' || action === 'parallel') {
      args.push('--symbols', String(symbols), '--interval', String(interval));
    }

    const { stdout } = await execFileAsync(command, args, { timeout: 20000 });
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
    const symbols = Array.isArray(body.symbols) ? body.symbols.join(',') : String(body.symbols || 'AAPL,TSLA');
    const symbol = String(body.symbol || 'AAPL');
    const interval = String(body.interval || '1d');
    const appKey = body.appKey ? String(body.appKey) : '';
    const appSecret = body.appSecret ? String(body.appSecret) : '';

    const { command, argsPrefix } = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    const args = [...argsPrefix, scriptPath, '--action', String(action)];
    if (action === 'bars' || action === 'quote') {
      args.push('--symbol', symbol, '--interval', interval);
    } else {
      args.push('--symbols', symbols, '--interval', interval);
    }

    if (appKey) {
      args.push('--app_key', appKey);
    }
    if (appSecret) {
      args.push('--app_secret', appSecret);
    }

    const { stdout } = await execFileAsync(command, args, { timeout: 25000 });
    const json = parseLastJsonLine(stdout);
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webull POST execution error' },
      { status: 500 }
    );
  }
}
