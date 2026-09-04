import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'PTT.BK';

  try {
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `py "${scriptPath}" --action single --symbol "${symbol}"`;

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

    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `py "${scriptPath}" --action ${action}`;

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
