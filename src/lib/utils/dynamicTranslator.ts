/**
 * StockHomeTH - Dynamic Data Non-Blocking Translation Engine
 * Enables instantaneous zero-lag UI translation with asynchronous background translation caching
 * for dynamic text (AI market summaries, news titles, takeaways, and insights).
 */

import type { Language } from '../i18n/translations';
import { translateClean, translateListClean, isPrimarilyThai } from './newsTranslationEngine';

/**
 * Translates dynamic content cleanly without mixing words between Thai and English
 */
export function translateDynamic(
  textTh?: string,
  textEn?: string,
  targetLang: Language = 'th'
): string {
  if (targetLang === 'th') {
    if (textTh && textTh.trim()) {
      return isPrimarilyThai(textTh) ? textTh : translateClean(textTh, 'th');
    }
    if (textEn && textEn.trim()) {
      return translateClean(textEn, 'th');
    }
    return '';
  }

  // targetLang === 'en'
  if (textEn && textEn.trim() && !isPrimarilyThai(textEn)) {
    return textEn;
  }
  if (textTh && textTh.trim()) {
    return translateClean(textTh, 'en');
  }
  if (textEn && textEn.trim()) {
    return translateClean(textEn, 'en');
  }

  return '';
}

/**
 * Helper to translate array of strings (e.g. key takeaways, catalysts)
 */
export function translateDynamicList(
  listTh: string[] = [],
  listEn?: string[],
  targetLang: Language = 'th'
): string[] {
  if (targetLang === 'th') {
    if (listTh && listTh.length > 0) {
      return listTh.map((item) => (isPrimarilyThai(item) ? item : translateClean(item, 'th')));
    }
    if (listEn && listEn.length > 0) {
      return translateListClean(listEn, 'th');
    }
    return [];
  }

  // targetLang === 'en'
  if (listEn && listEn.length > 0 && listEn.some((i) => !isPrimarilyThai(i))) {
    return listEn;
  }
  if (listTh && listTh.length > 0) {
    return translateListClean(listTh, 'en');
  }

  return [];
}
