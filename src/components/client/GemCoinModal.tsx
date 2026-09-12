'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import {
  GEMCOIN_TOPUP_PACKAGES,
  GEMCOIN_SUBSCRIPTION_TIERS,
  PROMO_CAMPAIGN_TEXT,
  GemCoinTopupPackage,
} from '@/config/gemCoinPackages';
import {
  PiggyBankSvg,
  WalletSvg,
  BriefcaseSvg,
  RoadsterSvg,
  CrownSvg,
  RocketSvg,
  CastleSvg,
  WhaleSvg,
  PromoClockSvg,
  TicketVoucherSvg,
} from '@/components/ui/TierSvgIcons';
import { FileText, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const GemCoinModal: React.FC = () => {
  const {
    isGemCoinModalOpen,
    gemCoinModalInitialTab,
    closeGemCoinModal,
    dailyGemCoinsRemaining,
    dailyGemCoins,
    topupGemCoins,
    totalGemCoinsAvailable,
    gemCoinLogs,
    currentTier,
    setTier,
    topupGemCoinsDirect,
    redeemPromoCode,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<'topup' | 'plans' | 'redeem' | 'logs'>(
    gemCoinModalInitialTab || 'topup'
  );
  const [promoInput, setPromoInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  if (!isGemCoinModalOpen) return null;

  const renderTierSvg = (iconType: GemCoinTopupPackage['iconType']) => {
    switch (iconType) {
      case 'piggy':
        return <PiggyBankSvg className="w-8 h-8" />;
      case 'wallet':
        return <WalletSvg className="w-8 h-8" />;
      case 'briefcase':
        return <BriefcaseSvg className="w-8 h-8" />;
      case 'roadster':
        return <RoadsterSvg className="w-8 h-8" />;
      case 'crown':
        return <CrownSvg className="w-8 h-8" />;
      case 'rocket':
        return <RocketSvg className="w-8 h-8" />;
      case 'castle':
        return <CastleSvg className="w-8 h-8" />;
      case 'whale':
        return <WhaleSvg className="w-8 h-8" />;
      default:
        return <GemCoinIcon className="w-8 h-8" />;
    }
  };

  const handleSimulateTopup = (pkg: GemCoinTopupPackage) => {
    const totalAdded = pkg.gemCoins + pkg.bonusCoins;
    topupGemCoinsDirect(totalAdded, pkg.name);
    setPurchaseNotice(
      `เติมเหรียญสำเร็จ! ได้รับ +${totalAdded.toLocaleString()} GemCoins เข้ากระเป๋า Top-up เรียบร้อยแล้ว`
    );
    setTimeout(() => setPurchaseNotice(null), 5000);
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setRedeemLoading(true);
    setRedeemResult(null);

    const res = await redeemPromoCode(promoInput.trim());
    setRedeemLoading(false);
    setRedeemResult(res);

    if (res.success) {
      setPromoInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="gemcoin-modal-box relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0d1319] border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Balance Summary */}
        <div className="gemcoin-modal-header flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090d12]">
          <div className="flex items-center gap-3">
            <GemCoinIcon className="w-8 h-8" glow={true} />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                GemCoin Wallet & Store
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentTier.toUpperCase()} Member
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                โควตารายวัน: <span className="text-emerald-400 font-medium">{dailyGemCoinsRemaining.toLocaleString()}</span> / {dailyGemCoins.toLocaleString()} | Top-up ถาวร: <span className="text-amber-400 font-medium">{topupGemCoins.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeGemCoinModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* 1-Month Launch Promo Alert Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <PromoClockSvg className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>{PROMO_CAMPAIGN_TEXT}</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
            EARLY BIRD LAUNCH
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="gemcoin-tabs-nav flex border-b border-slate-800/80 bg-[#0a0e14] px-4">
          <button
            onClick={() => setActiveTab('topup')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'topup'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GemCoinIcon className="w-4 h-4" glow={false} />
            เติมเหรียญ (Top-up)
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CrownSvg className="w-4 h-4" />
            สมัคร Plan รายเดือน
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'redeem'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TicketVoucherSvg className="w-4 h-4" />
            แลกโค้ดฟรี
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={15} />
            ประวัติการใช้งาน
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {purchaseNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-medium animate-fadeIn flex items-center justify-between">
              <span>{purchaseNotice}</span>
              <button
                onClick={() => setPurchaseNotice(null)}
                className="text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: TOP-UP PACKAGES (Micro to Whale Tiers) */}
          {activeTab === 'topup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">แพ็กเกจเติมเหรียญ GemCoin ถาวร</h3>
                  <p className="text-xs text-slate-400">
                    เหรียญไม่มีวันหมดอายุ ใช้ได้ตลอดกาล ตัดใช้เมื่อโควตารายวันหมด
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">ยอดคงเหลือรวม:</span>
                  <div className="text-base font-extrabold text-cyan-300 flex items-center justify-end gap-1">
                    <GemCoinIcon className="w-4 h-4" />
                    {totalGemCoinsAvailable.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stripe Checkout Direct Link */}
              <Link
                href="/payments"
                onClick={closeGemCoinModal}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      💳 ชำระเงินจริงผ่าน Stripe Checkout (บัตรเครดิต/เดบิต)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ไปที่หน้าร้านหลัก เลือกระหว่างเติมเหรียญ One-time หรือสมัครสมาชิกรายปีลดเพิ่ม 2 เดือน
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
                  ไปหน้าชำระเงิน →
                </span>
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {GEMCOIN_TOPUP_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : pkg.bestValue
                        ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/60 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {pkg.tag && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {pkg.tag}
                      </span>
                    )}

                    <div>
                      <div className="mb-2 p-2 rounded-lg bg-slate-800/60 w-fit">
                        {renderTierSvg(pkg.iconType)}
                      </div>
                      <h4 className="font-bold text-white text-sm">{pkg.name}</h4>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-cyan-300">
                          {pkg.gemCoins.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400">GemCoins</span>
                      </div>
                      {pkg.bonusCoins > 0 && (
                        <div className="mt-0.5 text-[11px] text-amber-400 font-semibold">
                          +แถมโบนัส {pkg.bonusCoins.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-extrabold text-emerald-400">
                          ฿{pkg.promoPrice}
                        </span>
                        <span className="text-xs line-through text-slate-500">
                          ฿{pkg.regularPrice}
                        </span>
                        <span className="text-[10px] text-amber-300/80 font-medium">
                          (1 ด. แรก)
                        </span>
                      </div>
                      <button
                        onClick={() => handleSimulateTopup(pkg)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          pkg.popular
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            : pkg.bestValue
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        เติมแพ็กเกจนี้
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION PLANS (Recurring + Permanent Top-up Rollover) */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  แผนสมาชิกรายเดือน (คุ้มค่ากว่า ได้ทั้ง Daily Quota + Top-up ถาวร)
                </h3>
                <p className="text-xs text-slate-400">
                  สมัครวันนี้ได้รับเหรียญสะสมถาวรเข้ากระเป๋าทันที พร้อมปลดล็อก AI เรือธง GPT-5 และ Claude Sonnet 5
                </p>
              </div>

              {/* Stripe Checkout Direct Link */}
              <Link
                href="/payments"
                onClick={closeGemCoinModal}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      💳 สมัครสมาชิกผ่านบัตรเครดิต/เดบิต (Stripe Checkout)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ไปที่หน้าร้านหลัก เลือกระหว่างรายเดือน หรือรายปี (ประหยัดเพิ่ม 2 เดือน)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
                  ไปหน้าชำระเงิน →
                </span>
              </Link>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {GEMCOIN_SUBSCRIPTION_TIERS.filter((t) => t.tier !== 'free' && t.tier !== 'dev').map((tierInfo) => {
                  const isCurrent = currentTier === tierInfo.tier;

                  return (
                    <div
                      key={tierInfo.tier}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-base">{tierInfo.name}</h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ใช้งานอยู่
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-xl font-extrabold text-white">
                            ฿{tierInfo.promoPriceMonthly}
                          </span>
                          <span className="text-xs line-through text-slate-500">
                            ฿{tierInfo.regularPriceMonthly}
                          </span>
                          <span className="text-xs text-slate-400">/ เดือน</span>
                        </div>

                        <p className="text-xs text-cyan-300 font-medium mb-3">
                          {tierInfo.highlight}
                        </p>

                        <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>
                              โควตารายวัน:{' '}
                              <strong className="text-emerald-300">
                                {tierInfo.dailyGemCoins.toLocaleString()}
                              </strong>{' '}
                              GemCoins / วัน
                            </span>
                          </div>
                          {tierInfo.permanentTopupBonus > 0 && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <span className="text-amber-400 font-bold">★</span>
                              <span>
                                แถมฟรี:{' '}
                                <strong className="text-amber-300">
                                  +{tierInfo.permanentTopupBonus.toLocaleString()}
                                </strong>{' '}
                                Top-up ถาวร
                              </span>
                            </div>
                          )}
                          <div className="pt-2 text-[11px] text-slate-400">
                            โมเดล AI ที่รองรับ:
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tierInfo.unlockedModels.map((m) => (
                                <span
                                  key={m.id}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                                >
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <button
                          disabled={isCurrent}
                          onClick={() => {
                            setTier(tierInfo.tier);
                            setPurchaseNotice(
                              `อัปเกรดเป็น ${tierInfo.name} สำเร็จ! ได้รับ +${tierInfo.permanentTopupBonus.toLocaleString()} GemCoins ถาวร`
                            );
                            setTimeout(() => setPurchaseNotice(null), 5000);
                          }}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md'
                          }`}
                        >
                          {isCurrent ? 'ใช้งานแผนนี้อยู่' : 'เลือกแผนนี้ (รับโบนัสถาวร)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REDEEM PROMO CODE (Created by Dev/Admin) */}
          {activeTab === 'redeem' && (
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2">
                  <TicketVoucherSvg className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">แลกรับรหัสของขวัญ GemCoins</h3>
                <p className="text-xs text-slate-400">
                  กรอกรหัสโปรโมชั่นที่ได้รับจากผู้พัฒนา (Dev/Admin) เพื่อรับ GemCoins เข้ากระเป๋า Top-up ฟรีทันที
                </p>
              </div>

              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="เช่น DEV-5000, STOCKHOME-1000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-500 outline-none uppercase font-mono tracking-wider transition-all"
                  />
                  {promoInput && (
                    <button
                      type="button"
                      onClick={() => setPromoInput('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={redeemLoading || !promoInput.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  {redeemLoading ? (
                    <span className="inline-block animate-spin">⌛</span>
                  ) : (
                    <span>แลกรับสิทธิ์ (Redeem)</span>
                  )}
                </button>
              </form>

              {redeemResult && (
                <div
                  className={`p-4 rounded-xl text-xs border ${
                    redeemResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <p className="font-semibold">{redeemResult.message}</p>
                </div>
              )}

              {/* Dev Test Hints */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">โค้ดสำหรับทดสอบในเครื่อง (Local Sandbox Test Codes):</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['DEV-5000', 'STOCKHOME-1000', 'EARLYBIRD-500'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setPromoInput(code)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] border border-slate-700"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USAGE LOG & BENCHMARKS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">ประวัติการใช้งาน GemCoins</h3>
                  <p className="text-xs text-slate-400">
                    บันทึกการเรียกใช้ AI ย้อนหลังแบบโปร่งใส (หักจาก Daily Free ก่อนแล้วตามด้วย Top-up)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <a
                    href="https://openrouter.ai/models?discount=true&arch=GPT,Claude,Gemini,Gemma,Grok,Qwen,DeepSeek&categories=finance,legal,roleplay,marketing,technology"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    เปรียบเทียบโมเดล ↗
                  </a>
                  <a
                    href="https://openrouter.ai/rankings#session-cost"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    คำนวณราคา LLM ↗
                  </a>
                </div>
              </div>

              {gemCoinLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  ยังไม่มีประวัติการใช้งาน GemCoins ในระบบ
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  {gemCoinLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{log.model}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              log.source === 'daily'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {log.source === 'daily' ? 'Daily Free' : 'Top-up Balance'}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-sm sm:max-w-md">
                          {log.summary || 'สอบถาม AI'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </div>
                      </div>

                      <div className="text-right font-extrabold flex items-center gap-1 text-cyan-300">
                        <GemCoinIcon className="w-3.5 h-3.5" glow={false} />
                        {log.gemCoinsUsed > 0 ? (
                          <span className="text-rose-400">-{log.gemCoinsUsed}</span>
                        ) : (
                          <span className="text-emerald-400">เครดิต</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
