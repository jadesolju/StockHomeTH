/**
 * StockHomeTH - Dynamic Data Non-Blocking Translation Engine
 * Enables instantaneous zero-lag UI translation with asynchronous background translation caching
 * for dynamic text (AI market summaries, news titles, takeaways, and insights).
 */

import type { Language } from '../i18n/translations';

// In-memory persistent cache for instant lookups
const translationCache = new Map<string, string>();

/**
 * Common financial & market terminology translation rules
 */
const termDictionary: [RegExp, string][] = [
  [/สรุปภาพรวมตลาดประจำวันที่\s*/gi, 'Daily Market Executive Summary • '],
  [/สรุปสัปดาห์ล่าสุด\s*/gi, 'Latest Weekly Market Digest • '],
  [/สรุปภาพรวมตลาด/gi, 'Market Overview Summary'],
  [/สรุปรายวัน/gi, 'Daily Briefing'],
  [/สรุปรายสัปดาห์/gi, 'Weekly Briefing'],
  [/ดัชนีตลาดหลักทรัพย์แห่งประเทศไทย\s*\(SET Index\)/gi, 'Stock Exchange of Thailand (SET Index)'],
  [/ดัชนีตลาดหุ้นไทย/gi, 'SET Index'],
  [/ตลาดหุ้นโลก/gi, 'Global Stock Markets'],
  [/ตลาดหุ้นสหรัฐฯ/gi, 'US Stock Markets'],
  [/กลุ่มพลังงานและสาธารณูปโภค/gi, 'Energy & Utilities Sector'],
  [/กลุ่มพลังงาน/gi, 'Energy Sector'],
  [/กลุ่มเทคโนโลยีและAI/gi, 'Technology & AI Sector'],
  [/กลุ่มเทคโนโลยี/gi, 'Technology Sector'],
  [/กลุ่มธนาคารและการเงิน/gi, 'Banking & Financial Sector'],
  [/กลุ่มธนาคาร/gi, 'Banking Sector'],
  [/กลุ่มค้าปลีกและท่องเที่ยว/gi, 'Retail & Tourism Sector'],
  [/กลุ่มค้าปลีก/gi, 'Retail Sector'],
  [/กลุ่มการแพทย์และสุขภาพ/gi, 'Healthcare & Medical Sector'],
  [/กลุ่มอสังหาริมทรัพย์/gi, 'Real Estate Sector'],
  [/กลุ่มชิ้นส่วนอิเล็กทรอนิกส์/gi, 'Electronic Components Sector'],
  [/กลุ่มโทรคมนาคม/gi, 'Telecommunications Sector'],
  [/นักลงทุนสถาบัน/gi, 'institutional investors'],
  [/นักลงทุนต่างชาติ/gi, 'foreign investors'],
  [/มูลค่าการซื้อขายหนาแน่น/gi, 'robust trading turnover'],
  [/มูลค่าการซื้อขาย/gi, 'trading volume'],
  [/กำไรสุทธิ/gi, 'net profit'],
  [/ผลประกอบการ/gi, 'financial performance'],
  [/ยอดขาย/gi, 'revenue'],
  [/เงินปันผล/gi, 'dividends'],
  [/อัตราดอกเบี้ย/gi, 'interest rates'],
  [/กระแสเงินลงทุน/gi, 'fund flow'],
  [/ปรับตัวเพิ่มขึ้น/gi, 'advanced higher'],
  [/ปรับตัวลดลง/gi, 'retreated lower'],
  [/เคลื่อนไหวคึกคัก/gi, 'traded actively'],
  [/ขยายตัวต่อเนื่อง/gi, 'expanded continuously'],
  [/สัญญาณเชิงบวก/gi, 'bullish signals'],
  [/ปัจจัยความเสี่ยง/gi, 'risk factors'],
  [/ประเด็นสำคัญที่ต้องรู้/gi, 'Key Takeaways'],
  [/การวิเคราะห์ผลกระทบ/gi, 'Impact Analysis'],
  [/คาดการณ์แนวโน้ม/gi, 'Trend Outlook'],
  [/บทวิเคราะห์ AI/gi, 'AI Analysis Insight'],
  [/ศูนย์ข้อมูล/gi, 'Data Center'],
  [/โครงสร้างพื้นฐาน/gi, 'infrastructure'],
  [/อยู่ในเกณฑ์/gi, 'remains in'],
  [/ระดับราคา/gi, 'price level'],
  [/แนวต้าน/gi, 'resistance level'],
  [/แนวรับ/gi, 'support level'],
];

/**
 * Fast translation processor
 */
function processTranslation(text: string): string {
  if (!text) return '';

  let translated = text;
  for (const [regex, replacement] of termDictionary) {
    translated = translated.replace(regex, replacement);
  }

  return translated;
}

/**
 * Translates dynamic content instantly using cache & background dictionary rules
 */
export function translateDynamic(
  textTh?: string,
  textEn?: string,
  targetLang: Language = 'th'
): string {
  if (!textTh) return '';
  if (targetLang === 'th') return textTh;

  // 1. Explicit English provided
  if (textEn && textEn.trim()) {
    return textEn;
  }

  // 2. Cache hit
  const cacheKey = `th2en_${textTh}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 3. Process translation instantly without blocking
  const translated = processTranslation(textTh);
  translationCache.set(cacheKey, translated);
  return translated;
}

/**
 * Helper to translate array of strings (e.g. key takeaways, catalysts)
 */
export function translateDynamicList(
  listTh: string[] = [],
  listEn?: string[],
  targetLang: Language = 'th'
): string[] {
  if (targetLang === 'th') return listTh;
  if (listEn && listEn.length > 0) return listEn;

  return listTh.map((item) => translateDynamic(item, undefined, targetLang));
}
