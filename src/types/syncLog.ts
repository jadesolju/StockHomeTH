export interface SyncLogItem {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  source: string;
  type: 'stocks' | 'indices' | 'news' | 'overview' | 'all';
  status: 'success' | 'warning' | 'error';
  itemCount?: number;
  summary: string;
  durationMs: number;
}
