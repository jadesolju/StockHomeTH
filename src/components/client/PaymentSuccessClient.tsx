'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, Sparkles, AlertCircle, ArrowRight, MessageSquareText } from 'lucide-react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { GemCoinIcon } from '@/components/ui/GemCoinIcon';

interface VerifyResult {
  success: boolean;
  paid: boolean;
  alreadyCredited?: boolean;
  mode?: 'payment' | 'subscription';
  packageId?: string;
  packageName?: string;
  gemCoinsAdded?: number;
  tier?: string;
  tierName?: string;
  dailyGemCoins?: number;
  amountPaid?: number;
  currency?: string;
  customerEmail?: string | null;
  message?: string;
}

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const {
    totalGemCoinsAvailable,
    topupGemCoinsDirect,
    setTier,
    currentTier,
  } = useSubscription();

  const [status, setStatus] = useState<'verifying' | 'success' | 'unpaid' | 'error'>(
    sessionId ? 'verifying' : 'success'
  );
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const verifiedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId || verifiedRef.current) return;
    verifiedRef.current = true;

    async function verify() {
      try {
        const res = await fetch('/api/payment/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data: VerifyResult = await res.json();

        if (!res.ok || !data.success) {
          if (data.paid === false) {
            setStatus('unpaid');
            setErrorText(data.message || 'การชำระเงินยังไม่เสร็จสมบูรณ์');
          } else {
            setStatus('error');
            setErrorText(data.message || 'ไม่สามารถตรวจสอบการชำระเงินได้');
          }
          return;
        }

        // Successfully paid! Immediately credit with zero delay
        if (data.paid) {
          if (!data.alreadyCredited) {
            if (data.mode === 'payment' && data.gemCoinsAdded) {
              topupGemCoinsDirect(data.gemCoinsAdded, data.packageName || 'GemCoin Package');
            } else if (data.mode === 'subscription' && data.tier) {
              setTier(data.tier as any);
            }
          }
          setResult(data);
          setStatus('success');
        }
      } catch (err: any) {
        console.error('[Verify Session Exception]:', err);
        setStatus('error');
        setErrorText('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    }

    verify();
  }, [sessionId, topupGemCoinsDirect, setTier]);

  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#0d131a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* State 1: Verifying in real-time (< 1s) */}
        {status === 'verifying' && (
          <div className="py-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">
              กำลังยืนยันยอดชำระเงินแบบเรียลไทม์...
            </h2>
            <p className="text-slate-400 text-sm">
              ระบบกำลังเชื่อมต่อกับ Stripe เพื่อเติมเหรียญ GemCoins ทันทีโดยไม่ต้องรอ
            </p>
          </div>
        )}

        {/* State 2: Success (Instant Fulfillment) */}
        {status === 'success' && (
          <div className="py-2">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              <CheckCircle size={44} className="text-emerald-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              ชำระเงินสำเร็จเรียบร้อย!
            </h1>

            <p className="text-slate-300 text-sm mb-6">
              ขอบคุณสำหรับการสนับสนุน ระบบได้ดำเนินการเติมสิทธิ์ให้บัญชีของคุณทันที
            </p>

            {/* Reward Card */}
            {result?.mode === 'payment' && result.gemCoinsAdded && (
              <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">แพ็กเกจที่ซื้อ:</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full border border-white/10">
                    {result.packageName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-white/5">
                  <div className="flex items-center gap-2">
                    <GemCoinIcon size={24} glow />
                    <span className="text-sm text-slate-300 font-semibold">ได้รับ GemCoins:</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-cyan-300">
                    +{result.gemCoinsAdded.toLocaleString()} Coins
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span>ยอดคงเหลือในกระเป๋าปัจจุบัน:</span>
                  <strong className="text-emerald-400 font-bold text-sm">
                    {totalGemCoinsAvailable.toLocaleString()} GemCoins
                  </strong>
                </div>
              </div>
            )}

            {result?.mode === 'subscription' && (
              <div className="bg-gradient-to-b from-purple-950/40 to-slate-900/60 border border-purple-500/30 rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">ระดับสิทธิ์ที่ปลดล็อก:</span>
                  <span className="text-xs font-bold text-purple-300 uppercase bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                    {result.tierName || currentTier}
                  </span>
                </div>
                <div className="py-2 border-y border-white/5 text-xs text-slate-300 space-y-1">
                  <div>• โควตา AI รายวัน: <strong>{result.dailyGemCoins?.toLocaleString() ?? 5000} GemCoins/วัน</strong></div>
                  <div>• ปลดล็อกโมเดลพรีเมียมทั้งหมดเรียบร้อย</div>
                </div>
              </div>
            )}

            {/* Quick Action Navigation */}
            <div className="flex flex-col gap-3">
              <Link
                href="/ai-helper"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(6,182,212,0.35)] transition-all ios-tappable"
              >
                <MessageSquareText size={18} />
                <span>เริ่มถามและวิเคราะห์หุ้นกับ AI ทันที</span>
                <ArrowRight size={16} />
              </Link>

              <div className="flex gap-2.5">
                <Link
                  href="/"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs sm:text-sm transition-all border border-white/10"
                >
                  กลับหน้าหลัก (Home)
                </Link>
                <Link
                  href="/payments"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs sm:text-sm transition-all border border-white/10"
                >
                  หน้าร้านค้าเหรียญ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Unpaid or Error */}
        {(status === 'unpaid' || status === 'error') && (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {status === 'unpaid' ? 'ยังไม่พบรายการชำระเงิน' : 'ไม่สามารถยืนยันยอดได้'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {errorText || 'หากคุณชำระเงินแล้วแต่ยังไม่ได้รับเหรียญ กรุณารอ 1-2 นาที หรือติดต่อฝ่ายสนับสนุน'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStatus('verifying');
                  verifiedRef.current = false;
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
              >
                ตรวจสอบอีกครั้ง
              </button>
              <Link
                href="/payments"
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm"
              >
                กลับหน้าร้านค้า
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
