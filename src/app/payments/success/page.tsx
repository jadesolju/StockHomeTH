import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PaymentSuccessClient } from '@/components/client/PaymentSuccessClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ชำระเงินสำเร็จ | StockHome TH',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center px-4">
      <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin" />
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
