import { AdminBackofficeClient } from '../../components/client/AdminBackofficeClient';
import { AdminAuthProvider } from '../../lib/context/AdminAuthContext';
import { AdminAuthGuard } from '../../components/client/AdminAuthGuard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'StockHomeTH • Master Backoffice Control Portal',
  description: 'ศูนย์ควบคุมความปลอดภัยระดับสูงสุดสำหรับผู้พัฒนาและเจ้าของระบบ',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
  },
};

export default function SecureAdminPage() {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        <AdminBackofficeClient />
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
}
