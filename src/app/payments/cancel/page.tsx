import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ยกเลิกการชำระเงิน | StockHome TH',
};

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-rose-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">ยกเลิกการชำระเงิน</h1>
        <p className="text-slate-400 text-sm mb-8">
          ไม่มีการตัดเงินใดๆ คุณสามารถเลือกแพ็กเกจอื่นหรือลองใหม่ได้เสมอ
        </p>
        <Link
          href="/payments"
          className="inline-block px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
        >
          กลับไปเลือกแพ็กเกจ
        </Link>
      </div>
    </div>
  );
}
