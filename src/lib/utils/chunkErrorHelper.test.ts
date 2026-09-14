import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isChunkLoadError, handleChunkErrorAutoReload } from './chunkErrorHelper';

describe('Error Boundary Chunk Error Handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isChunkLoadError', () => {
    it('returns true when error.name is ChunkLoadError', () => {
      const err = new Error('Some error');
      err.name = 'ChunkLoadError';
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('returns true when error message contains "Loading chunk"', () => {
      const err = new Error('Loading chunk 4429 failed. (error: https://www.stockhometh.online/_next/static/chunks/4429.js)');
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('returns true when error message contains "Failed to fetch dynamically imported module"', () => {
      const err = new Error('Failed to fetch dynamically imported module: https://example.com/chunk.js');
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('returns false for standard runtime errors', () => {
      const err = new Error('Network error or null pointer');
      expect(isChunkLoadError(err)).toBe(false);
    });
  });

  describe('handleChunkErrorAutoReload', () => {
    it('reloads window and updates sessionStorage on first chunk load error', () => {
      const mockStorage: Record<string, string> = {};
      vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
      });

      const reloadMock = vi.fn();
      vi.stubGlobal('window', {
        location: { reload: reloadMock },
      });

      const err = new Error('Loading chunk 4429 failed');
      const reloaded = handleChunkErrorAutoReload(err);

      expect(reloaded).toBe(true);
      expect(reloadMock).toHaveBeenCalledTimes(1);
      expect(mockStorage['stockhome_last_chunk_reload']).toBeDefined();
    });

    it('throttles window reload if called within 10 seconds of previous reload', () => {
      const now = Date.now();
      const mockStorage: Record<string, string> = {
        stockhome_last_chunk_reload: now.toString(),
      };

      vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
      });

      const reloadMock = vi.fn();
      vi.stubGlobal('window', {
        location: { reload: reloadMock },
      });

      const err = new Error('Loading chunk 4429 failed');
      const reloaded = handleChunkErrorAutoReload(err);

      expect(reloaded).toBe(false);
      expect(reloadMock).not.toHaveBeenCalled();
    });
  });
});
