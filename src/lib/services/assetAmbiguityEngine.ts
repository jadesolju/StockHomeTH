import { assetRegistry } from '@/config/assetRegistry';
import { AssetAmbiguityResult } from '@/types/asset';

/**
 * Universal Asset Ambiguity Engine (Zero-Assumption Policy)
 * Implements 3-Pillar Validation (Asset Identity, Trading Venue/Exchange, Denomination Currency)
 * Halts execution and triggers Clarification Loop if ambiguity or ticker collision is detected.
 */
export function resolveAssetAmbiguity(userInput: string): AssetAmbiguityResult {
  if (!userInput || typeof userInput !== 'string') {
    return { status: 'CLEAR_TO_PROCEED' };
  }

  const normalized = userInput.toLowerCase().trim();

  // Find if user query matches any ambiguous asset group
  for (const asset of assetRegistry) {
    const isKeywordMatched = asset.keywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase())
    );

    if (isKeywordMatched) {
      // Check if user has already specified an unambiguous exchange, currency, or explicit bypass keyword
      const hasBypass = asset.bypassKeywords?.some((b) =>
        normalized.includes(b.toLowerCase())
      );

      const hasExplicitOptionMatch = asset.options.some((opt) => {
        const exMatch = normalized.includes(opt.value.exchange.toLowerCase());
        const currMatch = normalized.includes(opt.value.currency.toLowerCase());
        const tickerMatch = opt.value.ticker && normalized.includes(opt.value.ticker.toLowerCase());
        return exMatch || currMatch || Boolean(tickerMatch);
      });

      // If user has supplied clear contextual identifiers, allow clear progression
      if (hasBypass || hasExplicitOptionMatch) {
        return {
          status: 'CLEAR_TO_PROCEED',
          pillars: {
            identity: asset.defaultIdentity,
          },
        };
      }

      // Missing explicit pillars -> Halt and request clarification
      return {
        status: 'NEED_CLARIFICATION',
        reason: `Missing exchange or asset class specification resulting in ticker collision for ${asset.defaultIdentity}.`,
        payload: {
          detected_identity: asset.defaultIdentity,
          prompt_text: `ระบบตรวจพบว่าคำถามเกี่ยวกับ "${asset.defaultIdentity}" มีการอ้างอิงราคาและประเภทสินทรัพย์หลายตลาด เพื่อความถูกต้องแม่นยำทางข้อมูล รบกวนคุณเลือกประเภทที่ต้องการวิเคราะห์ครับ:`,
          suggested_options: asset.options.map((opt) => ({
            label: opt.label,
            exchange: opt.value.exchange,
            currency: opt.value.currency,
            ticker: opt.value.ticker,
            description: opt.description,
          })),
        },
      };
    }
  }

  return { status: 'CLEAR_TO_PROCEED' };
}
