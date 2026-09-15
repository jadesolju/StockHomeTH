import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

interface PythonRunner {
  executable: string;
  baseArgs: string[];
}

let activePyRunner: PythonRunner | null = null;

async function getPythonRunner(): Promise<PythonRunner> {
  if (activePyRunner) return activePyRunner;

  const candidates: PythonRunner[] = [
    { executable: 'py', baseArgs: ['-3.11'] },
    { executable: 'py', baseArgs: [] },
    { executable: 'python3', baseArgs: [] },
    { executable: 'python', baseArgs: [] },
  ];

  for (const candidate of candidates) {
    try {
      const { stdout } = await execFileAsync(
        candidate.executable,
        [...candidate.baseArgs, '-c', "import yfinance; print('OK')"],
        { timeout: 3000 }
      );
      if (stdout.includes('OK')) {
        activePyRunner = candidate;
        return candidate;
      }
    } catch {
      // try next
    }
  }

  activePyRunner = { executable: 'python3', baseArgs: [] };
  return activePyRunner;
}

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.VERCEL !== '1';
}

const SAFE_SYMBOL_REGEX = /^[A-Za-z0-9._-]{1,20}$/;
const SAFE_ACTION_REGEX = /^[A-Za-z0-9_-]{1,30}$/;

export async function GET(req: NextRequest) {
  if (!isDevEnvironment()) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: This dev endpoint is only available in local development.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawSymbol = searchParams.get('symbol') || 'PTT.BK';

  if (!SAFE_SYMBOL_REGEX.test(rawSymbol)) {
    return NextResponse.json(
      { success: false, error: 'Invalid symbol parameter. Only alphanumeric, dots, and hyphens are allowed.' },
      { status: 400 }
    );
  }

  const symbol = rawSymbol.trim();

  try {
    const runner = await getPythonRunner();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const args = [...runner.baseArgs, scriptPath, '--action', 'single', '--symbol', symbol];

    const { stdout, stderr } = await execFileAsync(runner.executable, args, { timeout: 12000 });
    const json = JSON.parse(stdout.trim());

    return NextResponse.json({
      devInfo: {
        engine: 'Python yfinance v1.7.0',
        requestedSymbol: symbol,
        timestamp: new Date().toISOString(),
      },
      ...json,
      stderr: stderr || undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Dev yfinance execution failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDevEnvironment()) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: This dev endpoint is only available in local development.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const rawAction = body.action || 'stocks';

    if (!SAFE_ACTION_REGEX.test(rawAction)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action parameter. Only alphanumeric and hyphens are allowed.' },
        { status: 400 }
      );
    }

    const action = rawAction.trim();
    const runner = await getPythonRunner();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const args = [...runner.baseArgs, scriptPath, '--action', action];

    const { stdout, stderr } = await execFileAsync(runner.executable, args, { timeout: 20000 });
    const json = JSON.parse(stdout.trim());

    return NextResponse.json({
      devInfo: {
        engine: 'Python yfinance v1.7.0',
        action,
        timestamp: new Date().toISOString(),
      },
      ...json,
      stderr: stderr || undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Dev query failed',
      },
      { status: 500 }
    );
  }
}
