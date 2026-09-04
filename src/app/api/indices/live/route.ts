import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { mockMarketIndices } from '../../../../data/mockMarketData';

const execAsync = promisify(exec);

let cachedPayload: any = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

let activePythonCmd: string | null = null;
async function detectPythonCommand(): Promise<string> {
  if (activePythonCmd) return activePythonCmd;
  const candidates = ['py -3.11', 'py', 'python'];
  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} -c "import yfinance, sys; print('OK')"`, { timeout: 3000 });
      if (stdout.includes('OK')) {
        activePythonCmd = cmd;
        return cmd;
      }
    } catch {
      // Try next
    }
  }
  return 'py';
}

export async function GET() {
  const now = Date.now();
  if (cachedPayload && now - cacheTime < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      data: cachedPayload.data,
      indices: cachedPayload.indices,
      commodities: cachedPayload.commodities
    });
  }

  try {
    const pyCmd = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `${pyCmd} "${scriptPath}" --action indices`;
    const { stdout } = await execAsync(pythonCmd, { timeout: 15000 });
    
    // Parse last valid JSON line
    const lines = stdout.trim().split('\n');
    let json: any = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i].trim();
      if (l.startsWith('{') && l.endsWith('}')) {
        try {
          json = JSON.parse(l);
          break;
        } catch {}
      }
    }
    if (!json) {
      json = JSON.parse(stdout.trim());
    }

    if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
      cachedPayload = json;
      cacheTime = now;
      return NextResponse.json({
        success: true,
        source: 'live',
        count: json.data.length,
        data: json.data,
        indices: json.indices || json.data.filter((d: any) => d.category === 'index' || !d.category),
        commodities: json.commodities || json.data.filter((d: any) => d.category !== 'index')
      });
    }
  } catch (err) {
    console.warn('[Indices API] Python indices fetch warning, using live fallback:', err);
  }

  return NextResponse.json({ success: true, source: 'fallback', data: mockMarketIndices });
}

