'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSubscription, OWNER_DEV_IDENTIFIERS } from '@/lib/context/SubscriptionContext';
import { useClientAuth } from '@/lib/context/ClientAuthContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';
import {
  GEMCOIN_TOPUP_PACKAGES,
  GEMCOIN_SUBSCRIPTION_TIERS,
  PROMO_CAMPAIGN_TEXT,
  GemCoinTopupPackage,
} from '@/config/gemCoinPackages';
import {
  GEMCOIN_STRIPE_PRICE_IDS,
  SUBSCRIPTION_STRIPE_PRICE_IDS,
} from '@/config/stripePriceIds';
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
import { X, CreditCard, Sparkles, AlertCircle, Loader2, ArrowRight, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const GemCoinModal: React.FC = () => {
  const { user, openAuthModal } = useClientAuth();
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
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  // Instantly synchronize activeTab with gemCoinModalInitialTab whenever modal opens or tab changes
  useEffect(() => {
    if (isGemCoinModalOpen) {
      const targetTab = gemCoinModalInitialTab || 'topup';
      setActiveTab(targetTab);
      if (targetTab === 'redeem') {
        setTimeout(() => {
          promoInputRef.current?.focus();
        }, 150);
      }
    }
  }, [isGemCoinModalOpen, gemCoinModalInitialTab]);

  const isOwnerUser = Boolean(
    user &&
    (OWNER_DEV_IDENTIFIERS.emails.includes(user.email ?? '') ||
      OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid) ||
      OWNER_DEV_IDENTIFIERS.supabaseUids.includes(user.uid))
  );

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

  const handleCheckout = async (packageOrTierId: string, mode: 'payment' | 'subscription') => {
    if (loadingPkgId) return;

    if (!user) {
      try {
        sessionStorage.setItem(
          'pending_checkout_package',
          JSON.stringify({ packageId: packageOrTierId, mode })
        );
      } catch {}
      setCheckoutError('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนทำการเติมเงิน เพื่อให้ GemCoins ผูกกับบัญชีของคุณอย่างปลอดภัยถาวร');
      closeGemCoinModal();
      openAuthModal('login');
      return;
    }

    setLoadingPkgId(packageOrTierId);
    setCheckoutError(null);

    const priceId =
      mode === 'payment'
        ? GEMCOIN_STRIPE_PRICE_IDS[packageOrTierId]
        : SUBSCRIPTION_STRIPE_PRICE_IDS[packageOrTierId];

    if (!priceId || priceId.startsWith('price_REPLACE')) {
      setCheckoutError('Stripe Price ID ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้พัฒนา');
      setLoadingPkgId(null);
      return;
    }

    try {
      const res = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          packageId: packageOrTierId,
          mode,
          userId: user?.uid || undefined,
          userEmail: user?.email || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setCheckoutError(data.error || 'ไม่สามารถสร้างรายการชำระเงินได้ กรุณาลองใหม่อีกครั้ง');
        setTimeout(() => setLoadingPkgId(null), 2000);
        return;
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      setLoadingPkgId(null);
    }
  };

  const handleSimulateTopupOwner = (pkg: GemCoinTopupPackage) => {
    const totalAdded = pkg.gemCoins + pkg.bonusCoins;
    topupGemCoinsDirect(totalAdded, `[Dev Test] ${pkg.name}`);
    setPurchaseNotice(
      `[Dev Test] เติมเหรียญทดสอบสำเร็จ! +${totalAdded.toLocaleString()} GemCoins เข้ากระเป๋าแล้ว`
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
        {/* Header with Balance Summary & Main Store Direct Link */}
        <div className="gemcoin-modal-header flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#090d12]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <GemCoinIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" glow={true} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-white leading-tight truncate">
                  GemCoin Wallet & Store
                </h2>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shrink-0">
                  {currentTier.toUpperCase()} Member
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate sm:overflow-visible">
                โควตารายวัน: <span className="text-emerald-400 font-medium">{dailyGemCoinsRemaining.toLocaleString()}</span> / {dailyGemCoins.toLocaleString()} | Top-up: <span className="text-amber-400 font-medium">{topupGemCoins.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            <Link
              href="/payments"
              onClick={closeGemCoinModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg transition-colors"
              title="เปิดหน้าร้านค้าหลัก"
            >
              <CreditCard size={14} />
              <span>หน้าร้านหลัก</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={closeGemCoinModal}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors text-sm font-bold"
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Guest Guard Reassurance Banner */}
        {!user && (
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-950/50 via-slate-900 to-cyan-950/50 border-b border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
              <span>
                💡 <strong>โหมด Guest:</strong> เข้าสู่ระบบก่อนชำระเงินเพื่อให้ GemCoins ผูกกับบัญชีของคุณถาวร ปลอดภัย ไม่หายเมื่อเปลี่ยนเครื่อง
              </span>
            </div>
            <button
              onClick={() => {
                closeGemCoinModal();
                openAuthModal('login');
              }}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shrink-0 transition-all shadow-sm"
            >
              เข้าสู่ระบบก่อนเติมเงิน
            </button>
          </div>
        )}

        {/* 1-Month Launch Promo Alert Banner */}
        <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-b border-amber-500/20 flex items-center justify-between text-[11px] sm:text-xs text-amber-200">
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium truncate">
            <PromoClockSvg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="truncate">{PROMO_CAMPAIGN_TEXT}</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold shrink-0">
            EARLY BIRD LAUNCH
          </span>
        </div>

        {/* Mobile Viewport Tab Dropdown Switcher (Clean, High Contrast, Intuitive) */}
        <div className="block sm:hidden px-3.5 py-2.5 bg-[#0a0e14] border-b border-slate-800/80">
          <div className="relative">
            <label htmlFor="gemcoin-mobile-tab-select" className="sr-only">เลือกเมนูร้านค้า</label>
            <select
              id="gemcoin-mobile-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full appearance-none px-3.5 py-2.5 bg-slate-900 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-inner cursor-pointer"
            >
              <option value="topup" className="bg-[#0d1319] text-white">เติมเหรียญ (Top-up Packages)</option>
              <option value="plans" className="bg-[#0d1319] text-white">สมัคร Plan รายเดือน (Monthly Tiers)</option>
              <option value="redeem" className="bg-[#0d1319] text-amber-300 font-bold">🎫 แลกโค้ดฟรี (Coupon / Voucher)</option>
              <option value="logs" className="bg-[#0d1319] text-white">ประวัติการใช้งาน (Usage Logs)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="gemcoin-tabs-nav hidden sm:flex border-b border-slate-800/80 bg-[#0a0e14] px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('topup')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'topup'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <GemCoinIcon className="w-4 h-4" glow={false} />
            เติมเหรียญ (Top-up)
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'plans'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <CrownSvg className="w-4 h-4" />
            สมัคร Plan รายเดือน
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'redeem'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <TicketVoucherSvg className="w-4 h-4" />
            แลกโค้ดฟรี (Coupon / Voucher)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`gemcoin-tab-item px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'logs'
                ? 'active border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <FileText size={15} />
            ประวัติการใช้งาน
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
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

          {checkoutError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium animate-fadeIn flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
              <button
                onClick={() => setCheckoutError(null)}
                className="text-rose-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: TOP-UP PACKAGES (Real Stripe Checkout) */}
          {activeTab === 'topup' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">แพ็กเกจเติมเหรียญ GemCoin ถาวร</h3>
                  <p className="text-xs text-slate-400">
                    เหรียญไม่มีวันหมดอายุ ใช้ได้ตลอดกาล ตัดใช้เมื่อโควตารายวันหมด
                  </p>
                </div>
                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center bg-slate-900/60 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800 sm:border-0">
                  <span className="text-xs text-slate-400">ยอดคงเหลือรวม:</span>
                  <div className="text-base font-extrabold text-cyan-300 flex items-center gap-1">
                    <GemCoinIcon className="w-4 h-4" />
                    {totalGemCoinsAvailable.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stripe Checkout Direct Link (Responsive Vertical-on-Mobile Layout, No Text Collision) */}
              <Link
                href="/payments"
                onClick={closeGemCoinModal}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      💳 ไปที่หน้าร้านค้าหลัก (StockHome Official Store)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      เปิดหน้า /payments สำหรับแพ็กเกจรายปีลด 20% หรือดูข้อมูลความปลอดภัย
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-center sm:text-right pt-2 sm:pt-0 border-t border-emerald-500/20 sm:border-0 shrink-0">
                  <span className="inline-block w-full sm:w-auto py-1.5 px-3 rounded-lg sm:rounded-none bg-emerald-500/20 sm:bg-transparent text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    ไปหน้าร้านหลัก →
                  </span>
                </div>
              </Link>

              {/* Quick Promo Code Redeem Shortcut */}
              <button
                type="button"
                onClick={() => setActiveTab('redeem')}
                className="w-full p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <TicketVoucherSvg className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>มีโค้ดโปรโมชั่นหรือรหัสบัตรกำนัล? แลกรับ GemCoins ฟรี</span>
                </div>
                <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  กรอกโค้ดที่นี่ →
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {GEMCOIN_TOPUP_PACKAGES.map((pkg) => {
                  const isLoadingThis = loadingPkgId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${pkg.popular
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

                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
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

                        {/* Real Stripe Checkout Button */}
                        <button
                          disabled={Boolean(loadingPkgId)}
                          onClick={() => handleCheckout(pkg.id, 'payment')}
                          className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isLoadingThis
                              ? 'bg-slate-700 text-cyan-300 cursor-wait'
                              : pkg.popular
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                            }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>เปิด Stripe...</span>
                            </>
                          ) : (
                            <span>เติมแพ็กเกจนี้ (Stripe)</span>
                          )}
                        </button>

                        {/* Owner Dev Quick Test Bypass (Only for owner) */}
                        {isOwnerUser && (
                          <button
                            type="button"
                            onClick={() => handleSimulateTopupOwner(pkg)}
                            className="w-full py-1 text-[10px] text-slate-400 hover:text-amber-300 underline text-center"
                          >
                            [Owner Sandbox Bypass]
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION PLANS (Real Stripe Checkout) */}
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
              {/* Stripe Checkout Direct Link (Responsive Vertical-on-Mobile Layout) */}
              <Link
                href="/payments"
                onClick={closeGemCoinModal}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      💳 สมัครสมาชิกผ่านหน้าร้านหลัก (Stripe Official Checkout)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      เลือกดูแผนรายเดือน หรือสมัครแบบรายปี (ประหยัดเพิ่ม 2 เดือน) ได้ที่หน้า /payments
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-center sm:text-right pt-2 sm:pt-0 border-t border-emerald-500/20 sm:border-0 shrink-0">
                  <span className="inline-block w-full sm:w-auto py-1.5 px-3 rounded-lg sm:rounded-none bg-emerald-500/20 sm:bg-transparent text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    ไปหน้าร้านหลัก →
                  </span>
                </div>
              </Link>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {GEMCOIN_SUBSCRIPTION_TIERS.filter((t) => t.tier !== 'free' && t.tier !== 'dev').map((tierInfo) => {
                  const isCurrent = currentTier === tierInfo.tier;
                  const isLoadingThis = loadingPkgId === tierInfo.tier;

                  return (
                    <div
                      key={tierInfo.tier}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isCurrent
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
                          disabled={isCurrent || Boolean(loadingPkgId)}
                          onClick={() => handleCheckout(tierInfo.tier, 'subscription')}
                          className={`w-full py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${isCurrent
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : isLoadingThis
                                ? 'bg-slate-700 text-cyan-300 cursor-wait'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md'
                            }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>เปิด Stripe...</span>
                            </>
                          ) : isCurrent ? (
                            'ใช้งานแผนนี้อยู่'
                          ) : (
                            `สมัครแผน ${tierInfo.name} (Stripe)`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REDEEM PROMO CODE */}
          {activeTab === 'redeem' && (
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2">
                  <TicketVoucherSvg className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">กรอกโค้ดรับเหรียญ GemCoins ฟรี</h3>
                <p className="text-xs text-slate-400">
                  นำ Voucher Code จากแคมเปญ กิจกรรม หรือจากแอดมินมาแลกเป็น GemCoin ถาวรได้ทันที
                </p>
              </div>

              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    ref={promoInputRef}
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="พิมพ์โค้ด เช่น Stock-1234"
                    disabled={redeemLoading}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono tracking-wider text-center text-sm uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeemLoading || !promoInput.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {redeemLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังตรวจสอบโค้ด...</span>
                    </>
                  ) : (
                    <span>ยืนยันการแลกโค้ด</span>
                  )}
                </button>
              </form>

              {redeemResult && (
                <div
                  className={`p-4 rounded-xl text-xs border ${redeemResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                >
                  <p className="font-semibold">{redeemResult.message}</p>
                </div>
              )}

              {/* Code Format Hint */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-300 font-medium">รูปแบบโค้ดตัวอย่าง:</span>
                <span className="font-mono text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-sm">Stock-1234</span>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/payments"
                  onClick={closeGemCoinModal}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>หรือไปที่หน้าร้านค้าทางการเพื่อดูแพ็กเกจเติมเหรียญ (Official Store) →</span>
                </Link>
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
                <div className="py-12 px-4 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-medium space-y-2">
                  <p className="text-slate-300 font-semibold text-sm">ยังไม่มีประวัติการใช้งาน GemCoins ในระบบ</p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    เมื่อคุณเริ่มต้นใช้งาน AI วิเคราะห์หุ้น ประวัติการหักเหรียญ GemCoins จะถูกบันทึกแสดงที่นี่โดยอัตโนมัติ
                  </p>
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
                            className={`px-1.5 py-0.5 rounded text-[10px] ${log.source === 'daily'
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
