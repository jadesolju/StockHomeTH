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
import { AdminAuthProvider } from '../lib/context/AdminAuthContext';
import { SubscriptionProvider } from '../lib/context/SubscriptionContext';
import { PricingModal } from '../components/client/PricingModal';
import { LocalRoleSwitcher } from '../components/client/LocalRoleSwitcher';
import { PwaRegisterClient } from '../components/client/PwaRegisterClient';
import { PwaBottomNav } from '../components/client/PwaBottomNav';
import { GlobalNewsModal } from '../components/client/GlobalNewsModal';
import { TermsDisclaimerModal } from '../components/client/TermsDisclaimerModal';
import { LegalFooter } from '../components/client/LegalFooter';
import { GemCoinModal } from '../components/client/GemCoinModal';
import { JsonLdSchema } from '../components/seo/JsonLdSchema';
import { buildMetadata } from '../lib/seo/metadata';

export const metadata: Metadata = buildMetadata();

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
        <JsonLdSchema />
        <ThemeProvider>
          <LanguageProvider>
            <ClientAuthProvider>
              <AdminAuthProvider>
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
                          </AdminAuthProvider>
</ClientAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
