
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "../components/ui/toaster"
import { FirebaseClientProvider } from '../firebase';
import { NetworkStatusIndicator } from '../components/network-status-indicator';
import Script from 'next/script';
import { FirebaseMessagingProvider } from '../components/firebase-messaging-provider';
import MobileNav from '../components/mobile-nav';

export const metadata: Metadata = {
  title: 'Pocketnews TV',
  description: 'Your daily news, channelled.',
  manifest: '/manifest.json',
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
      <body className="font-body antialiased">
        <div className="max-w-7xl mx-auto pb-16 sm:pb-0">
          <FirebaseClientProvider>
            <FirebaseMessagingProvider />
            <NetworkStatusIndicator />
            {children}
            <MobileNav />
          </FirebaseClientProvider>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
