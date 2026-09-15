import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

describe('GET /api/indices/live', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return live indices response structure', async () => {
    const req = new Request('http://localhost:3000/api/indices/live?refresh=1');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
  });
});
