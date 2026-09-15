import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import * as childProcess from 'child_process';

vi.mock('child_process', () => {
  return {
    execFile: vi.fn(),
  };
});

describe('Webull API route command injection fix', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('passes appKey and appSecret securely as separate arguments in POST without shell execution', async () => {
    const mockExecFile = vi.mocked(childProcess.execFile);

    // Mock execFile implementation
    mockExecFile.mockImplementation((file, args, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      if (cb) {
        cb(null, { stdout: JSON.stringify({ success: true, provider: 'webull' }), stderr: '' });
      }
      return {} as any;
    });

    const maliciousAppKey = 'testkey"; touch /tmp/pwned; echo "';
    const maliciousAppSecret = 'testsecret & calc.exe';

    const req = new NextRequest('http://localhost/api/stocks/webull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        appKey: maliciousAppKey,
        appSecret: maliciousAppSecret,
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify execFile was called and arguments were passed safely in array
    expect(mockExecFile).toHaveBeenCalled();
    const calls = mockExecFile.mock.calls;
    const lastCall = calls[calls.length - 1];
    const argsArray = lastCall[1] as string[];

    expect(argsArray).toContain('--app_key');
    expect(argsArray).toContain(maliciousAppKey);
    expect(argsArray).toContain('--app_secret');
    expect(argsArray).toContain(maliciousAppSecret);
  });

  it('handles GET requests securely without shell interpolation', async () => {
    const mockExecFile = vi.mocked(childProcess.execFile);

    mockExecFile.mockImplementation((file, args, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      if (cb) {
        cb(null, { stdout: JSON.stringify({ success: true, action: 'quote' }), stderr: '' });
      }
      return {} as any;
    });

    const maliciousSymbol = 'AAPL; whoami';
    const req = new NextRequest(`http://localhost/api/stocks/webull?action=quote&symbol=${encodeURIComponent(maliciousSymbol)}`);

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const calls = mockExecFile.mock.calls;
    const lastCall = calls[calls.length - 1];
    const argsArray = lastCall[1] as string[];

    expect(argsArray).toContain('--symbol');
    expect(argsArray).toContain(maliciousSymbol);
  });
});
