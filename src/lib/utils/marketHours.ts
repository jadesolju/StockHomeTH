/**
 * StockHomeTH - Market Hours & Auto-Sync Schedule Engine
 * Calculates real-time market status for SET (Thailand) and US (NYSE/NASDAQ)
 * Determines intelligent API polling intervals:
 * - Stocks: 1 minute (60s) during Market Open / 30 minutes (1800s) during Market Closed
 * - News & AI Analysis: 30 minutes (1800s) constant interval
 */

export interface MarketStatusInfo {
  isOpen: boolean;
  statusText: string;
  statusTextTh: string;
  session: string;
  nextChange: string;
}

export interface DualMarketStatus {
  set: MarketStatusInfo;
  us: MarketStatusInfo;
  isAnyOpen: boolean;
  stockSyncIntervalMs: number;
  stockSyncIntervalLabel: string;
  newsSyncIntervalMs: number;
  newsSyncIntervalLabel: string;
}

/**
 * Get accurate Bangkok time components
 */
function getBangkokTime(date = new Date()): { day: number; hour: number; minute: number } {
  const bkkFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hourCycle: 'h23',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
  });

  const parts = bkkFormatter.formatToParts(date);
  let weekdayStr = '';
  let hour = 0;
  let minute = 0;

  for (const p of parts) {
    if (p.type === 'weekday') weekdayStr = p.value;
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
  }

  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = daysMap[weekdayStr] ?? date.getDay();
  return { day, hour, minute };
}

/**
 * Get accurate US Eastern Time components (handles EDT / EST automatically)
 */
function getUsEasternTime(date = new Date()): { day: number; hour: number; minute: number } {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
  });

  const parts = nyFormatter.formatToParts(date);
  let weekdayStr = '';
  let hour = 0;
  let minute = 0;

  for (const p of parts) {
    if (p.type === 'weekday') weekdayStr = p.value;
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
  }

  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = daysMap[weekdayStr] ?? date.getDay();
  return { day, hour, minute };
}

/**
 * SET (Thailand) Trading Hours:
 * Mon-Fri:
 * Morning: 10:00 - 12:30
 * Afternoon: 14:30 - 16:30
 */
export function getSetMarketStatus(date = new Date()): MarketStatusInfo {
  const { day, hour, minute } = getBangkokTime(date);
  const isWeekend = day === 0 || day === 6;
  const timeInMinutes = hour * 60 + minute;

  if (isWeekend) {
    return {
      isOpen: false,
      statusText: 'Closed (Weekend)',
      statusTextTh: 'ปิดทำการ (วันหยุด)',
      session: 'weekend',
      nextChange: 'เปิดวันจันทร์ 10:00 น.',
    };
  }

  // Morning Session: 10:00 - 12:30 (600 - 750)
  if (timeInMinutes >= 600 && timeInMinutes < 750) {
    return {
      isOpen: true,
      statusText: 'Open (Morning Session)',
      statusTextTh: 'เปิดทำการ (ภาคเช้า 10:00 - 12:30)',
      session: 'morning',
      nextChange: 'พักเที่ยง 12:30 น.',
    };
  }

  // Intermission / Lunch: 12:30 - 14:30 (750 - 870)
  if (timeInMinutes >= 750 && timeInMinutes < 870) {
    return {
      isOpen: false,
      statusText: 'Lunch Break (Intermission)',
      statusTextTh: 'พักกลางวัน (12:30 - 14:30)',
      session: 'lunch',
      nextChange: 'เปิดภาคบ่าย 14:30 น.',
    };
  }

  // Afternoon Session: 14:30 - 16:30 (870 - 990)
  if (timeInMinutes >= 870 && timeInMinutes < 990) {
    return {
      isOpen: true,
      statusText: 'Open (Afternoon Session)',
      statusTextTh: 'เปิดทำการ (ภาคบ่าย 14:30 - 16:30)',
      session: 'afternoon',
      nextChange: 'ปิดตลาด 16:30 น.',
    };
  }

  // Pre-Open Morning: 09:30 - 10:00 (570 - 600)
  if (timeInMinutes >= 570 && timeInMinutes < 600) {
    return {
      isOpen: false,
      statusText: 'Pre-Open (Morning)',
      statusTextTh: 'Pre-Open รอเปิดตลาดเช้า',
      session: 'pre-open',
      nextChange: 'เปิดตลาด 10:00 น.',
    };
  }

  // Otherwise closed
  return {
    isOpen: false,
    statusText: 'Closed (After Hours)',
    statusTextTh: 'ปิดทำการ (นอกเวลาซื้อขาย)',
    session: 'closed',
    nextChange: timeInMinutes >= 990 ? 'เปิดพรุ่งนี้ 10:00 น.' : 'เปิดวันนี้ 10:00 น.',
  };
}

/**
 * US Markets (NYSE / NASDAQ) Trading Hours:
 * Mon-Fri: 09:30 - 16:00 ET (New York time)
 */
export function getUsMarketStatus(date = new Date()): MarketStatusInfo {
  const { day, hour, minute } = getUsEasternTime(date);
  const isWeekend = day === 0 || day === 6;
  const timeInMinutes = hour * 60 + minute;

  if (isWeekend) {
    return {
      isOpen: false,
      statusText: 'Closed (Weekend)',
      statusTextTh: 'ปิดทำการ (วันหยุด)',
      session: 'weekend',
      nextChange: 'เปิดวันจันทร์ 20:30 น. (ไทย)',
    };
  }

  // Regular Trading Session: 09:30 - 16:00 ET (570 - 960)
  if (timeInMinutes >= 570 && timeInMinutes < 960) {
    return {
      isOpen: true,
      statusText: 'Open (Regular Trading)',
      statusTextTh: 'เปิดทำการ (Regular Trading 20:30 - 03:00 น.)',
      session: 'regular',
      nextChange: 'ปิดตลาด 16:00 ET (03:00/04:00 น. ไทย)',
    };
  }

  // Pre-Market: 04:00 - 09:30 ET (240 - 570)
  if (timeInMinutes >= 240 && timeInMinutes < 570) {
    return {
      isOpen: false,
      statusText: 'Pre-Market',
      statusTextTh: 'Pre-Market สหรัฐฯ',
      session: 'pre-market',
      nextChange: 'เปิดตลาด 09:30 ET',
    };
  }

  // After-Hours: 16:00 - 20:00 ET (960 - 1200)
  if (timeInMinutes >= 960 && timeInMinutes < 1200) {
    return {
      isOpen: false,
      statusText: 'After-Hours',
      statusTextTh: 'After-Hours สหรัฐฯ',
      session: 'after-hours',
      nextChange: 'ปิด After-Hours 20:00 ET',
    };
  }

  return {
    isOpen: false,
    statusText: 'Closed',
    statusTextTh: 'ปิดทำการ (นอกเวลาซื้อขาย)',
    session: 'closed',
    nextChange: 'เปิดตลาดคืนนี้ 20:30/21:30 น. ไทย',
  };
}

export interface MarketBriefingSession {
  sessionKey: 'morning' | 'midday' | 'evening' | 'night';
  labelTh: string;
  labelEn: string;
  timeRangeTh: string;
  timeRangeEn: string;
  descriptionTh: string;
  descriptionEn: string;
}

/**
 * 4 Daily Market Briefing Checkpoints (สาย เที่ยง เย็น ค่ำ)
 */
export function getCurrentBriefingSession(date = new Date()): MarketBriefingSession {
  const { hour, minute } = getBangkokTime(date);
  const timeInMinutes = hour * 60 + minute;

  // 1. รอบสาย (Morning Session: 08:30 - 11:30 น.)
  if (timeInMinutes >= 510 && timeInMinutes < 690) {
    return {
      sessionKey: 'morning',
      labelTh: 'รอบสาย (Morning Pre-Market)',
      labelEn: 'Morning Session (Pre-Market)',
      timeRangeTh: '08:30 - 11:30 น.',
      timeRangeEn: '08:30 - 11:30 BKK',
      descriptionTh: 'สรุปเตรียมความพร้อมก่อนเปิดตลาดเช้า SET และทิศทางตลาดโลก',
      descriptionEn: 'SET morning pre-market briefing and global macro catalyst setup'
    };
  }

  // 2. รอบเที่ยง (Midday / Lunch Session: 11:30 - 15:30 น.)
  if (timeInMinutes >= 690 && timeInMinutes < 930) {
    return {
      sessionKey: 'midday',
      labelTh: 'รอบเที่ยง (Midday Intermission)',
      labelEn: 'Midday Session (Lunch Break)',
      timeRangeTh: '11:30 - 15:30 น.',
      timeRangeEn: '11:30 - 15:30 BKK',
      descriptionTh: 'สรุปภาพรวมปิดตลาดภาคเช้า SET และแนวโน้มภาคบ่าย',
      descriptionEn: 'Midday market wrap-up and afternoon outlook'
    };
  }

  // 3. รอบเย็น (Evening / SET Close Session: 15:30 - 19:30 น.)
  if (timeInMinutes >= 930 && timeInMinutes < 1170) {
    return {
      sessionKey: 'evening',
      labelTh: 'รอบเย็น (Evening Market Close)',
      labelEn: 'Evening Session (SET Close)',
      timeRangeTh: '15:30 - 19:30 น.',
      timeRangeEn: '15:30 - 19:30 BKK',
      descriptionTh: 'สรุปภาวะปิดตลาดประจำวัน SET & mai และเตรียมความพร้อมตลาดสหรัฐฯ',
      descriptionEn: 'SET daily closing summary and US market preview'
    };
  }

  // 4. รอบค่ำ (Night / Wall Street Session: 19:30 - 08:30 น.)
  return {
    sessionKey: 'night',
    labelTh: 'รอบค่ำ (Night & Wall Street)',
    labelEn: 'Night Session (Wall Street Open)',
    timeRangeTh: '19:30 - 08:30 น.',
    timeRangeEn: '19:30 - 08:30 BKK',
    descriptionTh: 'เกาะติดเปิดตลาดหุ้นสหรัฐฯ (S&P 500, NASDAQ) และข่าวเศรษฐกิจโลก',
    descriptionEn: 'Wall Street opening bell and global economic wrap-up'
  };
}

/**
 * Returns true if today is Sunday (day 0) for Weekly 7-Day Synthesis
 */
export function isSundayWeeklySynthesisDay(date = new Date()): boolean {
  const { day } = getBangkokTime(date);
  return day === 0;
}

/**
 * Get unified real-time status and smart sync intervals
 */
export function getDualMarketStatus(date = new Date()): DualMarketStatus {
  const setStatus = getSetMarketStatus(date);
  const usStatus = getUsMarketStatus(date);
  const isAnyOpen = setStatus.isOpen || usStatus.isOpen;
  const briefingSession = getCurrentBriefingSession(date);
  const isSunday = isSundayWeeklySynthesisDay(date);

  // 5 minutes when open, 30 minutes when closed (Prevents API rate limiting and stability issues)
  const stockSyncIntervalMs = isAnyOpen ? 5 * 60 * 1000 : 30 * 60 * 1000;
  const stockSyncIntervalLabel = isAnyOpen ? '5 นาที (ตลาดเปิด)' : '30 นาที (ตลาดปิด/ประหยัด API)';

  // News and AI Analysis: 4 sessions daily (สาย เที่ยง เย็น ค่ำ)
  const newsSyncIntervalMs = 30 * 60 * 1000;
  const newsSyncIntervalLabel = `4 รอบต่อวัน (${briefingSession.labelTh}${isSunday ? ' • วันอาทิตย์สรุปสัปดาห์' : ''})`;

  return {
    set: setStatus,
    us: usStatus,
    isAnyOpen,
    stockSyncIntervalMs,
    stockSyncIntervalLabel,
    newsSyncIntervalMs,
    newsSyncIntervalLabel,
  };
}
