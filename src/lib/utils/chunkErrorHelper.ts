export function isChunkLoadError(error: Error): boolean {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = error.message || '';
  return (
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading CSS chunk')
  );
}

export function handleChunkErrorAutoReload(error: Error): boolean {
  if (typeof window === 'undefined') return false;
  if (!isChunkLoadError(error)) return false;

  const LAST_RELOAD_KEY = 'stockhome_last_chunk_reload';
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem(LAST_RELOAD_KEY) || '0', 10);
  const RELOAD_THROTTLE_MS = 10000; // 10 seconds throttle

  if (now - lastReload > RELOAD_THROTTLE_MS) {
    sessionStorage.setItem(LAST_RELOAD_KEY, now.toString());
    window.location.reload();
    return true;
  }
  return false;
}
