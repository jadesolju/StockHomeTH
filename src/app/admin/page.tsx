import { AdminBackofficeClient } from '../../components/client/AdminBackofficeClient';
import { AdminAuthProvider } from '../../lib/context/AdminAuthContext';
import { AdminAuthGuard } from '../../components/client/AdminAuthGuard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'StockHomeTH • Admin & Dev Backoffice Control Portal',
  description: 'ระบบหลังบ้านสำหรับ Dev & Admin สำหรับควบคุม Engine ตลาดหุ้น, สั่ง Sync ข้อมูล SET & US, และจัดการ Logs',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        <AdminBackofficeClient />
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
}
