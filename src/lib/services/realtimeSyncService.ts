/**
 * Client Real-Time Sync Service
 * Connects PC and Mobile in real-time using Web Stream / Server-Sent Events (SSE) & BroadcastChannel.
 */

export type RealtimeSyncEventType =
  | 'WALLET_UPDATED'
  | 'SESSIONS_UPDATED'
  | 'AIRDROP_RECEIVED'
  | 'TIER_CHANGED'
  | 'PING';

export interface RealtimeSyncMessage {
  type: RealtimeSyncEventType;
  userId: string;
  payload?: any;
  timestamp: number;
}

type SyncHandler = (payload: any, message: RealtimeSyncMessage) => void;

class RealtimeSyncManager {
  private currentUserId: string | null = null;
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private handlers = new Map<RealtimeSyncEventType, Set<SyncHandler>>();
  private reconnectTimeout: any = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('stockhome_realtime_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.dispatchEvent(event.data);
          }
        };
      } catch (e) {
        console.warn('[RealtimeSync] BroadcastChannel init warning:', e);
      }
    }
  }

  /**
   * Connects the real-time sync stream for the given user ID.
   */
  public connect(userId: string): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined' || !userId) return;
    const cleanId = userId.trim();

    if (this.currentUserId === cleanId && this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      return; // Already connected
    }

    this.disconnect();
    this.currentUserId = cleanId;
    this.isConnecting = true;

    try {
      const url = `/api/sync/events?userId=${encodeURIComponent(cleanId)}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        // console.log('[RealtimeSync] Connected for user:', cleanId);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const msg: RealtimeSyncMessage = JSON.parse(event.data);
          if (msg && msg.type && msg.type !== 'PING') {
            this.dispatchEvent(msg);
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto reconnect after 5 seconds
        if (!this.reconnectTimeout && this.currentUserId) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (this.currentUserId) {
              this.connect(this.currentUserId);
            }
          }, 5000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn('[RealtimeSync] Connection error:', err);
    }
  }

  /**
   * Disconnects the sync stream.
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentUserId = null;
    this.isConnecting = false;
  }

  /**
   * Registers a listener for a specific event type.
   */
  public on(type: RealtimeSyncEventType, handler: SyncHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set<SyncHandler>();
      this.handlers.set(type, set);
    }
    set.add(handler);

    return () => {
      const currentSet = this.handlers.get(type);
      if (currentSet) {
        currentSet.delete(handler);
      }
    };
  }

  /**
   * Broadcasts an event locally to other open tabs and remotely via Server API.
   */
  public broadcast(type: RealtimeSyncEventType, payload?: any): void {
    if (!this.currentUserId) return;

    const msg: RealtimeSyncMessage = {
      type,
      userId: this.currentUserId,
      payload,
      timestamp: Date.now(),
    };

    // 1. Dispatch locally to other tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {}
    }

    // 2. Dispatch to server broadcast endpoint
    fetch('/api/sync/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    }).catch(() => {});
  }

  private dispatchEvent(msg: RealtimeSyncMessage): void {
    if (this.currentUserId && msg.userId !== this.currentUserId) {
      return; // Not for this user
    }

    const set = this.handlers.get(msg.type);
    if (set && set.size > 0) {
      for (const handler of set) {
        try {
          handler(msg.payload, msg);
        } catch (err) {
          console.warn('[RealtimeSync] Handler error:', err);
        }
      }
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
