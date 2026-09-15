export type SyncEventType = 
  | 'WALLET_UPDATED' 
  | 'SESSIONS_UPDATED' 
  | 'AIRDROP_RECEIVED' 
  | 'TIER_CHANGED' 
  | 'PING';

export interface SyncMessage {
  type: SyncEventType;
  userId: string;
  payload?: any;
  timestamp: number;
}

type Subscriber = (msg: SyncMessage) => void;

// In-memory registry of active subscribers per userId
declare global {
  var __stockhome_sync_subscribers: Map<string, Set<Subscriber>> | undefined;
}

function getSubscribersMap(): Map<string, Set<Subscriber>> {
  if (!globalThis.__stockhome_sync_subscribers) {
    globalThis.__stockhome_sync_subscribers = new Map<string, Set<Subscriber>>();
  }
  return globalThis.__stockhome_sync_subscribers;
}

export function subscribeUserSync(userId: string, callback: Subscriber): () => void {
  const cleanId = userId.trim();
  const map = getSubscribersMap();
  let set = map.get(cleanId);
  if (!set) {
    set = new Set<Subscriber>();
    map.set(cleanId, set);
  }
  set.add(callback);

  return () => {
    const currentSet = map.get(cleanId);
    if (currentSet) {
      currentSet.delete(callback);
      if (currentSet.size === 0) {
        map.delete(cleanId);
      }
    }
  };
}

export function broadcastSyncEvent(userId: string, type: SyncEventType, payload?: any): void {
  if (!userId) return;
  const cleanId = userId.trim();
  const map = getSubscribersMap();
  const set = map.get(cleanId);

  const message: SyncMessage = {
    type,
    userId: cleanId,
    payload,
    timestamp: Date.now(),
  };

  if (set && set.size > 0) {
    for (const callback of set) {
      try {
        callback(message);
      } catch (err) {
        console.warn('[ServerSyncBroadcaster] Failed to dispatch to subscriber:', err);
      }
    }
  }
}
