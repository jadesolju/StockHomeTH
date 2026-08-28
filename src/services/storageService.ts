import type { StockNewsItem } from '../types/stockNews';
import { mockNewsItems } from '../data/mockNewsData';

const LOCAL_STORAGE_NEWS_KEY = 'stockpulse_news_database_v1';
const LOCAL_STORAGE_API_KEY = 'stockpulse_gemini_api_key';

export const storageService = {
  /**
   * โหลดรายการข่าวสารทั้งหมด (ผสมระหว่าง LocalStorage และ MockData)
   */
  loadNewsItems: (): StockNewsItem[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NEWS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StockNewsItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load news from localStorage:', err);
    }
    // Fallback to mock data and initialize storage
    storageService.saveNewsItems(mockNewsItems);
    return mockNewsItems;
  },

  /**
   * บันทึกรายการข่าวสารลง LocalStorage
   */
  saveNewsItems: (items: StockNewsItem[]): void => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NEWS_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save news to localStorage:', err);
    }
  },

  /**
   * เพิ่มข่าวใหม่ที่ผ่านการสรุปโดย AI เข้าไปในระบบ
   */
  addNewNewsItem: (newItem: StockNewsItem): StockNewsItem[] => {
    const current = storageService.loadNewsItems();
    // ป้องกันการบันทึกซ้ำ
    const filtered = current.filter((item) => item.id !== newItem.id);
    const updated = [newItem, ...filtered];
    storageService.saveNewsItems(updated);
    return updated;
  },

  /**
   * โหลด API Key
   */
  loadApiKey: (): string => {
    return localStorage.getItem(LOCAL_STORAGE_API_KEY) || '';
  },

  /**
   * บันทึก API Key
   */
  saveApiKey: (key: string): void => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, key.trim());
  }
};
