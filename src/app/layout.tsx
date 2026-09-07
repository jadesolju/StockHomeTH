import type { Metadata, Viewport } from 'next';
import '../styles/glass-ios.css';
import { HeaderClientNav } from '../components/client/HeaderClientNav';
import { SyncLogModal } from '../components/client/SyncLogModal';
import { MarketSyncProvider } from '../lib/context/MarketSyncContext';
import { LanguageProvider } from '../lib/context/LanguageContext';
import { ThemeProvider } from '../lib/context/ThemeContext';
import { PwaRegisterClient } from '../components/client/PwaRegisterClient';

export const metadata: Metadata = {
  title: 'StockHomeTH • สรุปข่าวหุ้น AI และข้อมูลตลาดหุ้นไทย & สหรัฐฯ',
  description:
    'แพลตฟอร์มวิเคราะห์ข่าวหุ้น สรุปการเงินประจำวันด้วย Google Gemini AI และข้อมูลตลาดหุ้น SET & US Real-time สำหรับนักลงทุนยุคใหม่',
  keywords: ['หุ้นไทย', 'SET Index', 'หุ้นสหรัฐ', 'AI สรุปข่าวหุ้น', 'Stock Analysis', 'Gemini AI', 'การเงิน'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/Gemini-svg.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/Gemini-svg.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
        <link rel="icon" type="image/svg+xml" href="/Gemini-svg.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/Gemini-svg.svg" />
      </head>
      <body style={{ minHeight: '100vh', margin: 0, paddingBottom: '100px' }}>
        <ThemeProvider>
          <LanguageProvider>
            <MarketSyncProvider>
              <PwaRegisterClient />
              <HeaderClientNav />
              <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
                {children}
              </main>
              <SyncLogModal />
            </MarketSyncProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
