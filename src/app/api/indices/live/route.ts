import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { mockMarketIndices } from '../../../../data/mockMarketData';

const execAsync = promisify(exec);

let cachedIndices: any = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function GET() {
  const now = Date.now();
  if (cachedIndices && now - cacheTime < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, source: 'cache', data: cachedIndices });
  }

  try {
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `py "${scriptPath}" --action indices`;
    const { stdout } = await execAsync(pythonCmd, { timeout: 15000 });
    const json = JSON.parse(stdout.trim());

    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      cachedIndices = json.data;
      cacheTime = now;
      return NextResponse.json({ success: true, source: 'live', data: json.data });
    }
  } catch (err) {
    console.warn('[Indices API] Python indices fetch warning, using live fallback:', err);
  }

  return NextResponse.json({ success: true, source: 'fallback', data: mockMarketIndices });
}
