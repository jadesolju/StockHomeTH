/**
 * aiQueueService.ts
 * Tiered Concurrency & Priority Queue Manager for AI Chat Requests.
 * Ensures Whale, VIP, and Dev requests bypass waiting queues (Priority 1),
 * while managing system load and preventing upstream OpenRouter rate limits.
 */

import { SubscriptionTier, getTierLimits } from '@/config/tierModelLimits';

interface QueuedItem<T> {
  id: string;
  tier: SubscriptionTier;
  priority: number;
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  queuedAt: number;
}

// Maximum concurrent requests to OpenRouter per tier bracket
const MAX_ACTIVE_CONCURRENCY = 12;

let activeCount = 0;
const waitingQueue: QueuedItem<any>[] = [];

/**
 * Executes a task through the priority queue based on the user's tier.
 * Priority 1 (Whale / VIP / Dev) immediately bypasses the queue.
 */
export async function executeWithPriorityQueue<T>(
  tier: SubscriptionTier,
  task: () => Promise<T>
): Promise<T> {
  const limits = getTierLimits(tier);
  const priority = limits.queuePriority;

  // Priority 1: Instant VIP & Whale bypass
  if (priority === 1 || activeCount < MAX_ACTIVE_CONCURRENCY) {
    activeCount++;
    try {
      return await task();
    } finally {
      activeCount = Math.max(0, activeCount - 1);
      processNextInQueue();
    }
  }

  // Otherwise, place into prioritized queue
  return new Promise<T>((resolve, reject) => {
    const item: QueuedItem<T> = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tier,
      priority,
      task,
      resolve,
      reject,
      queuedAt: Date.now(),
    };

    // Insert sorted by priority (1 is highest, 4 is lowest)
    let insertIndex = waitingQueue.findIndex((q) => q.priority > priority);
    if (insertIndex === -1) {
      waitingQueue.push(item);
    } else {
      waitingQueue.splice(insertIndex, 0, item);
    }

    // Timeout safety: if stuck in queue for > 20 seconds, reject gracefully
    setTimeout(() => {
      const idx = waitingQueue.findIndex((q) => q.id === item.id);
      if (idx !== -1) {
        waitingQueue.splice(idx, 1);
        reject(new Error('คำขอของคุณอยู่ในคิวนานเกินไปเนื่องจากมีผู้ใช้งานหนาแน่น กรุณาลองใหม่อีกครั้ง'));
      }
    }, 20000);
  });
}

function processNextInQueue() {
  if (waitingQueue.length === 0 || activeCount >= MAX_ACTIVE_CONCURRENCY) {
    return;
  }

  const next = waitingQueue.shift();
  if (!next) return;

  activeCount++;
  next
    .task()
    .then((result) => {
      next.resolve(result);
    })
    .catch((err) => {
      next.reject(err);
    })
    .finally(() => {
      activeCount = Math.max(0, activeCount - 1);
      processNextInQueue();
    });
}

/**
 * Returns current queue diagnostics for health and monitoring.
 */
export function getQueueStatus() {
  return {
    activeCount,
    waitingCount: waitingQueue.length,
    waitingByTier: {
      whale: waitingQueue.filter((q) => q.tier === 'whale').length,
      vip: waitingQueue.filter((q) => q.tier === 'vip').length,
      pro: waitingQueue.filter((q) => q.tier === 'pro').length,
      lite: waitingQueue.filter((q) => q.tier === 'lite').length,
      free: waitingQueue.filter((q) => q.tier === 'free').length,
    },
  };
}
