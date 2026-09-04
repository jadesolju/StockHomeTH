import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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
    } catch {}
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
  const action = searchParams.get('action') || 'status';
  const symbol = searchParams.get('symbol') || 'AAPL';
  const symbols = searchParams.get('symbols') || 'AAPL,TSLA,NVDA';
  const interval = searchParams.get('interval') || '1d';

  try {
    const pyCmd = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    let cmd = `${pyCmd} "${scriptPath}" --action ${action}`;
    if (action === 'bars' || action === 'quote') {
      cmd += ` --symbol "${symbol}" --interval "${interval}"`;
    } else if (action === 'batch_bars' || action === 'parallel') {
      cmd += ` --symbols "${symbols}" --interval "${interval}"`;
    }

    const { stdout } = await execAsync(cmd, { timeout: 20000 });
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

    const pyCmd = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'webull_engine.py');

    let cmd = `${pyCmd} "${scriptPath}" --action ${action}`;
    if (action === 'bars' || action === 'quote') {
      cmd += ` --symbol "${symbol}" --interval "${interval}"`;
    } else {
      cmd += ` --symbols "${symbols}" --interval "${interval}"`;
    }

    if (appKey) cmd += ` --app_key "${appKey}"`;
    if (appSecret) cmd += ` --app_secret "${appSecret}"`;

    const { stdout } = await execAsync(cmd, { timeout: 25000 });
    const json = parseLastJsonLine(stdout);
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webull POST execution error' },
      { status: 500 }
    );
  }
}
