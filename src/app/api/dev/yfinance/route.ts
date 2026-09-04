import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

let activePyCmd: string | null = null;

async function getPythonCommand(): Promise<string> {
  if (activePyCmd) return activePyCmd;
  for (const cmd of ['py -3.11', 'py', 'python']) {
    try {
      const { stdout } = await execAsync(`${cmd} -c "import yfinance; print('OK')"`, { timeout: 3000 });
      if (stdout.includes('OK')) {
        activePyCmd = cmd;
        return cmd;
      }
    } catch {
      // try next
    }
  }
  activePyCmd = 'py -3.11';
  return activePyCmd;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'PTT.BK';

  try {
    const pyCmd = await getPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `${pyCmd} "${scriptPath}" --action single --symbol "${symbol}"`;

    const { stdout, stderr } = await execAsync(pythonCmd, { timeout: 12000 });
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
  try {
    const body = await req.json();
    const action = body.action || 'stocks';

    const pyCmd = await getPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `${pyCmd} "${scriptPath}" --action ${action}`;

    const { stdout, stderr } = await execAsync(pythonCmd, { timeout: 20000 });
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
