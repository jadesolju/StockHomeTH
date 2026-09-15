import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as childProcess from 'child_process';
import { GET, POST } from './route';

vi.mock('child_process', () => {
  return {
    execFile: vi.fn(),
  };
});

describe('Webull Route API Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should handle valid requests and execute execFile with parameterized array', async () => {
    const mockExecFile = childProcess.execFile as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const cb = typeof options === 'function' ? options : callback;
      cb(null, { stdout: JSON.stringify({ success: true, action: 'status' }), stderr: '' });
    });

    const request = new NextRequest('http://localhost:3000/api/stocks/webull?action=status');
    const response = await GET(request);
    const json = await response.json();

    expect(json).toEqual({ success: true, action: 'status' });
    expect(mockExecFile).toBeCalled();

    const lastCall = mockExecFile.mock.calls[mockExecFile.mock.calls.length - 1];
    const args = lastCall[1] as string[];
    expect(args).toContain('--action');
    expect(args).toContain('status');
  });

  it('POST should sanitize appKey and appSecret and pass them as separate array arguments', async () => {
    const mockExecFile = childProcess.execFile as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const cb = typeof options === 'function' ? options : callback;
      cb(null, { stdout: JSON.stringify({ success: true }), stderr: '' });
    });

    const request = new NextRequest('http://localhost:3000/api/stocks/webull', {
      method: 'POST',
      body: JSON.stringify({
        action: 'batch_bars',
        symbols: 'AAPL,TSLA',
        appKey: 'myKey" && echo HACKED ;',
        appSecret: 'mySecret\nrm -rf /',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json).toEqual({ success: true });

    const lastCall = mockExecFile.mock.calls[mockExecFile.mock.calls.length - 1];
    const args = lastCall[1] as string[];

    const appKeyIdx = args.indexOf('--app_key');
    expect(appKeyIdx).toBeGreaterThan(-1);
    expect(args[appKeyIdx + 1]).toBe('myKey" && echo HACKED ;');

    const appSecretIdx = args.indexOf('--app_secret');
    expect(appSecretIdx).toBeGreaterThan(-1);
    expect(args[appSecretIdx + 1]).toBe('mySecretrm -rf /');
  });

  it('GET should sanitize malicious action, symbol, and interval parameters', async () => {
    const mockExecFile = childProcess.execFile as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const cb = typeof options === 'function' ? options : callback;
      cb(null, { stdout: JSON.stringify({ success: true }), stderr: '' });
    });

    const url = 'http://localhost:3000/api/stocks/webull?action=bars;whoami&symbol=AAPL;cat /etc/passwd&interval=1d;calc.exe';
    const request = new NextRequest(url);
    await GET(request);

    const lastCall = mockExecFile.mock.calls[mockExecFile.mock.calls.length - 1];
    const args = lastCall[1] as string[];

    expect(args).toContain('status');
    expect(args.join(' ')).not.toContain('cat /etc/passwd');
    expect(args.join(' ')).not.toContain('calc.exe');
  });
});
