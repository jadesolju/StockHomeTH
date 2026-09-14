import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPromoCodesStore,
  findPromoCode,
  redeemCodeForUser,
  createPromoCode,
  deletePromoCode,
} from './promoCodeService';

describe('PromoCodeService & Redemption Counting', () => {
  const createdTestCodes: string[] = [];

  beforeEach(() => {
    delete (global as any).__stockhome_promo_codes__;
  });

  afterEach(() => {
    while (createdTestCodes.length > 0) {
      const code = createdTestCodes.pop();
      if (code) deletePromoCode(code);
    }
  });

  it('should list initialized promo codes with correct counting fields', () => {
    const codes = getPromoCodesStore();
    expect(codes.length).toBeGreaterThan(0);
    const devCode = codes.find((c) => c.code === 'DEV-5000');
    expect(devCode).toBeDefined();
    expect(typeof devCode?.currentRedemptions).toBe('number');
    expect(devCode?.maxRedemptions).toBe(100);
  });

  it('should find promo codes case-insensitively', () => {
    const codeUpper = findPromoCode('DEV-5000');
    const codeLower = findPromoCode('dev-5000');
    const codeMixed = findPromoCode('  dEv-5000  ');
    expect(codeUpper).toBeDefined();
    expect(codeLower?.code).toBe('DEV-5000');
    expect(codeMixed?.code).toBe('DEV-5000');
  });

  it('should redeem promo code and increment currentRedemptions correctly', () => {
    const code = `TEST-COUNT-${Date.now()}`;
    createdTestCodes.push(code);

    const createRes = createPromoCode({
      code,
      gemCoins: 100,
      maxRedemptions: 2,
      expiresAt: null,
      description: 'Test count promo',
      isActive: true,
    });
    expect(createRes.success).toBe(true);

    const user1Res = redeemCodeForUser(code, 'user_1', 'user1@example.com');
    expect(user1Res.success).toBe(true);
    expect(user1Res.gemCoins).toBe(100);

    const found = findPromoCode(code);
    expect(found?.currentRedemptions).toBe(1);
    expect(found?.redemptionsCount).toBe(1);
    expect(found?.redeemedUsers).toContain('user_1');
    expect(found?.redemptions).toHaveLength(1);
    expect(found?.redemptions?.[0].userEmail).toBe('user1@example.com');
    expect(found?.redemptions?.[0].userId).toBe('user_1');

    // Duplicate redemption by same UID should be blocked
    const duplicateUidRes = redeemCodeForUser(code, 'user_1', 'other_email@example.com');
    expect(duplicateUidRes.success).toBe(false);
    expect(duplicateUidRes.message).toContain('เคยใช้สิทธิ์');

    // Duplicate redemption by same Email (with different UID) should also be blocked
    const duplicateEmailRes = redeemCodeForUser(code, 'different_uid', 'user1@example.com');
    expect(duplicateEmailRes.success).toBe(false);
    expect(duplicateEmailRes.message).toContain('เคยใช้สิทธิ์');

    // Second unique user should succeed
    const user2Res = redeemCodeForUser(code, 'user_2', 'user2@example.com');
    expect(user2Res.success).toBe(true);

    const found2 = findPromoCode(code);
    expect(found2?.currentRedemptions).toBe(2);

    // Third user should be blocked due to maxRedemptions limit
    const user3Res = redeemCodeForUser(code, 'user_3');
    expect(user3Res.success).toBe(false);
    expect(user3Res.message).toContain('ครบตามจำนวนแล้ว');
  });

  it('should support creating and deleting promo codes', () => {
    const tempCode = `TEMP-DEL-${Date.now()}`;
    const createRes = createPromoCode({
      code: tempCode,
      gemCoins: 50,
      maxRedemptions: 10,
      expiresAt: null,
      description: 'Temporary code',
      isActive: true,
    });
    expect(createRes.success).toBe(true);
    expect(findPromoCode(tempCode)).toBeDefined();

    const deleteRes = deletePromoCode(tempCode);
    expect(deleteRes.success).toBe(true);
    expect(findPromoCode(tempCode)).toBeUndefined();
  });
});
