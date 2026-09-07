import type { Metadata, Viewport } from 'next';
import '../styles/glass-ios.css';
import { HeaderClientNav } from '../components/client/HeaderClientNav';
import { SyncLogModal } from '../components/client/SyncLogModal';
import { AuthModal } from '../components/client/AuthModal';
import { UserProfileModal } from '../components/client/UserProfileModal';
import { MarketSyncProvider } from '../lib/context/MarketSyncContext';
import { LanguageProvider } from '../lib/context/LanguageContext';
import { ThemeProvider } from '../lib/context/ThemeContext';
import { ClientAuthProvider } from '../lib/context/ClientAuthContext';
import { SubscriptionProvider } from '../lib/context/SubscriptionContext';
import { PricingModal } from '../components/client/PricingModal';
import { LocalRoleSwitcher } from '../components/client/LocalRoleSwitcher';
import { PwaRegisterClient } from '../components/client/PwaRegisterClient';
import { PwaBottomNav } from '../components/client/PwaBottomNav';

export const metadata: Metadata = {
  title: 'StockHomeTH • สรุปข่าวหุ้น AI และข้อมูลตลาดหุ้นไทย & สหรัฐฯ',
  description:
    'แพลตฟอร์มวิเคราะห์ข่าวหุ้น สรุปการเงินประจำวันด้วย Google Gemini AI และข้อมูลตลาดหุ้น SET & US Real-time สำหรับนักลงทุนยุคใหม่',
  keywords: ['หุ้นไทย', 'SET Index', 'หุ้นสหรัฐ', 'AI สรุปข่าวหุ้น', 'Stock Analysis', 'Gemini AI', 'การเงิน'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StockHomeTH',
  },
  openGraph: {
    title: 'StockHomeTH • สรุปข่าวหุ้น AI และข้อมูลตลาดหุ้นไทย & สหรัฐฯ',
    description: 'แพลตฟอร์มวิเคราะห์และสรุปข่าวการเงินด้วย AI แบบ Real-time',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#007AFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body style={{ minHeight: '100vh', margin: 0, paddingBottom: '100px' }}>
        <ThemeProvider>
          <LanguageProvider>
            <ClientAuthProvider>
              <SubscriptionProvider>
                <MarketSyncProvider>
                  <PwaRegisterClient />
                  <HeaderClientNav />
                  <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
                    {children}
                  </main>
                  <AuthModal />
                  <UserProfileModal />
                  <PricingModal />
                  <LocalRoleSwitcher />
                  <PwaBottomNav />
                  <SyncLogModal />
                </MarketSyncProvider>
              </SubscriptionProvider>
            </ClientAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
