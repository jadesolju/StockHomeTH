'use client';

import { useState, useCallback } from 'react';
import { GEMCOIN_TOPUP_PACKAGES, GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';
import { GEMCOIN_STRIPE_PRICE_IDS, SUBSCRIPTION_STRIPE_PRICE_IDS, SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS } from '@/config/stripePriceIds';
import {
  PiggyBankSvg,
  WalletSvg,
  BriefcaseSvg,
  RoadsterSvg,
  CrownSvg,
  RocketSvg,
  CastleSvg,
  WhaleSvg,
} from '@/components/ui/TierSvgIcons';
import type { GemCoinTopupPackage } from '@/config/gemCoinPackages';
import { Loader2, Zap, Crown, AlertCircle } from 'lucide-react';




// ------------------------------------------------------------------
// Helper: render SVG icon by iconType
// ------------------------------------------------------------------
function TierIcon({ iconType, className }: { iconType: GemCoinTopupPackage['iconType']; className?: string }) {
  const props = { className: className ?? 'w-7 h-7' };
  switch (iconType) {
    case 'piggy':     return <PiggyBankSvg {...props} />;
    case 'wallet':    return <WalletSvg {...props} />;
    case 'briefcase': return <BriefcaseSvg {...props} />;
    case 'roadster':  return <RoadsterSvg {...props} />;
    case 'crown':     return <CrownSvg {...props} />;
    case 'rocket':    return <RocketSvg {...props} />;
    case 'castle':    return <CastleSvg {...props} />;
    case 'whale':     return <WhaleSvg {...props} />;
    default:          return <Zap {...props} />;
  }
}

type Tab = 'topup' | 'subscription';

export default function PaymentsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('topup');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Throttled checkout trigger – 30s cooldown per session
  // ------------------------------------------------------------------
  const handleCheckout = useCallback(
    async (packageId: string, mode: 'payment' | 'subscription') => {
      if (loadingId) return; // block if already loading
      setLoadingId(packageId);
      setErrorMsg(null);

      const priceId =
        mode === 'payment'
          ? GEMCOIN_STRIPE_PRICE_IDS[packageId]
          : billingCycle === 'yearly'
          ? SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS[packageId]
          : SUBSCRIPTION_STRIPE_PRICE_IDS[packageId];

      if (!priceId || priceId.startsWith('price_REPLACE')) {
        setErrorMsg('Stripe Price ID ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้พัฒนา');
        setLoadingId(null);
        return;
      }

      try {
        const res = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, mode }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error ?? 'ไม่สามารถสร้าง Checkout ได้ กรุณาลองใหม่');
          // Keep button disabled for 30s if rate-limited, 3s otherwise
          setTimeout(() => setLoadingId(null), res.status === 429 ? 30_000 : 3_000);
          return;
        }

        // Redirect to Stripe Checkout full-page (session.url returned by API)
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg('ไม่ได้รับ URL จาก Stripe กรุณาลองใหม่');
          setLoadingId(null);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        setLoadingId(null);
      }
    },
    [loadingId]
  );

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      {/* ──── Hero Header ──── */}
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0d1a2a] to-[#070b10]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <Zap size={12} className="animate-pulse" />
            เติมเหรียญ GemCoin
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            เลือกแพ็กเกจที่ใช่สำหรับคุณ
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            GemCoin ถาวร ไม่มีวันหมดอายุ ใช้วิเคราะห์หุ้นกับ AI เรือธงได้ทันที
          </p>
        </div>
      </div>

      {/* ──── Tab Switcher ──── */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex gap-2 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit mx-auto mb-8">
          <button
            onClick={() => setActiveTab('topup')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'topup'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={14} />
            เติม GemCoins
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown size={14} />
            แผนสมาชิกรายเดือน
          </button>
        </div>

        {/* ──── Error Banner ──── */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-6 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ──── TOP-UP PACKAGES ──── */}
        {activeTab === 'topup' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
            {GEMCOIN_TOPUP_PACKAGES.map((pkg) => {
              const isLoading = loadingId === pkg.id;
              const isDisabled = loadingId !== null;
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col rounded-2xl border p-4 transition-all ${
                    pkg.popular
                      ? 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                      : pkg.bestValue
                      ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-slate-900/60 shadow-[0_0_20px_rgba(245,158,11,0.10)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  {pkg.tag && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                      {pkg.tag}
                    </span>
                  )}

                  {/* Icon */}
                  <div className="mb-3 p-2 rounded-xl bg-slate-800/60 w-fit">
                    <TierIcon iconType={pkg.iconType} className="w-7 h-7" />
                  </div>

                  {/* Name + Coins */}
                  <h3 className="font-bold text-white text-sm">{pkg.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-cyan-300">
                      {(pkg.gemCoins + pkg.bonusCoins).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">GemCoins</span>
                  </div>
                  {pkg.bonusCoins > 0 && (
                    <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      รวมโบนัส +{pkg.bonusCoins.toLocaleString()}
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-auto pt-3 border-t border-slate-800/80 mt-4">
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-xl font-extrabold text-emerald-400">฿{pkg.promoPrice}</span>
                      <span className="text-xs line-through text-slate-500">฿{pkg.regularPrice}</span>
                    </div>
                    <button
                      onClick={() => handleCheckout(pkg.id, 'payment')}
                      disabled={isDisabled}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        pkg.popular
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                          : pkg.bestValue
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isLoading ? 'กำลังโหลด...' : 'ชำระเงิน'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ──── SUBSCRIPTION PLANS ──── */}
        {activeTab === 'subscription' && (
          <div className="pb-16">
            {/* Monthly / Yearly toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รายปี
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  ประหยัด 2 เดือน
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GEMCOIN_SUBSCRIPTION_TIERS.filter((t) => t.tier !== 'free').map((tier) => {
                const isLoading = loadingId === tier.tier;
                const isDisabled = loadingId !== null;
                const displayPrice = billingCycle === 'yearly' ? tier.promoPriceYearly : tier.promoPriceMonthly;
                const strikePrice  = billingCycle === 'yearly' ? tier.regularPriceYearly : tier.regularPriceMonthly;
                const perMonthPrice = billingCycle === 'yearly'
                  ? Math.round(tier.promoPriceYearly / 12)
                  : null;
                return (
                  <div
                    key={tier.tier}
                    className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
                  >
                    <h3 className="font-bold text-white text-base mb-1">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-2xl font-extrabold text-white">฿{displayPrice.toLocaleString()}</span>
                      <span className="text-xs line-through text-slate-500">฿{strikePrice.toLocaleString()}</span>
                    </div>
                    {billingCycle === 'yearly' && perMonthPrice ? (
                      <p className="text-[11px] text-emerald-400 font-semibold mb-1">
                        ≈ ฿{perMonthPrice.toLocaleString()} / เดือน
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mb-1">/ เดือน</p>
                    )}
                    <p className="text-xs text-cyan-300 font-medium mb-4">{tier.highlight}</p>

                    <ul className="space-y-1.5 text-xs text-slate-300 mb-5">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        {tier.dailyGemCoins.toLocaleString()} GemCoins / วัน
                      </li>
                      {tier.permanentTopupBonus > 0 && (
                        <li className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">★</span>
                          แถม +{tier.permanentTopupBonus.toLocaleString()} ถาวร
                        </li>
                      )}
                    </ul>

                    <button
                      onClick={() => handleCheckout(tier.tier, 'subscription')}
                      disabled={isDisabled}
                      className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isLoading ? 'กำลังโหลด...' : `สมัคร${billingCycle === 'yearly' ? 'รายปี' : 'รายเดือน'}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
