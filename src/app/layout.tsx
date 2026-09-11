import type { Metadata, Viewport } from 'next';
import '../styles/glass-ios.css';
import '../styles/ai-chat.css';
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
import { GlobalNewsModal } from '../components/client/GlobalNewsModal';
import { TermsDisclaimerModal } from '../components/client/TermsDisclaimerModal';
import { LegalFooter } from '../components/client/LegalFooter';
import { GemCoinModal } from '../components/client/GemCoinModal';

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
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
        <ThemeProvider>
          <LanguageProvider>
            <ClientAuthProvider>
              <SubscriptionProvider>
                <MarketSyncProvider>
                  <PwaRegisterClient />
                  <HeaderClientNav />
                  <div className="app-content-wrapper">
                    {children}
                  </div>
                  <LegalFooter />
                  <TermsDisclaimerModal />
                  <AuthModal />
                  <UserProfileModal />
                  <PricingModal />
                  <GemCoinModal />
                  <LocalRoleSwitcher />
                  <PwaBottomNav />
                  <GlobalNewsModal />
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
