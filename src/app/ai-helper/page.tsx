import { Metadata } from 'next';
import { AiHelperChatClient } from '@/components/client/AiHelperChatClient';

export const metadata: Metadata = {
  title: 'AI Helper| StockHomeTH ผู้ช่วยวิเคราะห์หุ้นและการเงิน',
  description:
    'แชทสอบถามความรู้การเงิน วิเคราะห์หุ้นรายตัว และสรุปข่าวสารตลาดหุ้นไทยแบบ Real-time ด้วยโมเดลปัญญาประดิษฐ์ระดับแนวหน้า',
};

export default function AiHelperPage() {
  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', padding: 0, display: 'flex', flexDirection: 'column' }}>
      <AiHelperChatClient />
    </main>
  );
}

