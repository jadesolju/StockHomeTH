import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ชำระเงินสำเร็จ | StockHome TH',
};

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">ชำระเงินสำเร็จ!</h1>
        <p className="text-slate-400 text-sm mb-8">
          GemCoins ของคุณจะถูกเติมเข้ากระเป๋าภายในไม่กี่วินาที
          หากไม่ได้รับภายใน 5 นาที กรุณาติดต่อฝ่ายสนับสนุน
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
          >
            กลับหน้าหลัก
          </Link>
          <Link
            href="/payments"
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            เติม GemCoins เพิ่ม
          </Link>
        </div>
      </div>
    </div>
  );
}
