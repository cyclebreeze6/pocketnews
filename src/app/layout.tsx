
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "../components/ui/toaster"
import { FirebaseClientProvider } from '../firebase';
import { NetworkStatusIndicator } from '../components/network-status-indicator';
import Script from 'next/script';
import { FirebaseMessagingProvider } from '../components/firebase-messaging-provider';
import MobileNav from '../components/mobile-nav';
import { CookieConsentBanner } from '../components/cookie-consent-banner';
import { RegionProvider } from '../context/region-context';

export const metadata: Metadata = {
  title: 'PocketStream',
  description: 'Your daily news, channelled.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overscroll-y-none">
        <div className="mx-auto min-h-dvh max-w-7xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <FirebaseClientProvider>
            <RegionProvider>
              <FirebaseMessagingProvider />
              <NetworkStatusIndicator />
              {children}
              <MobileNav />
              <CookieConsentBanner />
            </RegionProvider>
          </FirebaseClientProvider>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
