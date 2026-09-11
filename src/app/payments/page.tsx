import type { Metadata } from 'next';
import PaymentsClient from '@/components/client/PaymentsClient';

export const metadata: Metadata = {
  title: 'เติม GemCoins | StockHome TH',
  description: 'เลือกแพ็กเกจเติม GemCoins เพื่อใช้วิเคราะห์หุ้นกับ AI เรือธง',
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}
