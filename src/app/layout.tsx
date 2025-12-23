import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "../components/ui/toaster"
import { FirebaseClientProvider } from '../firebase';
import { NetworkStatusIndicator } from '../components/network-status-indicator';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Pocketnews TV',
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
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    window.OneSignalDeferred = window.OneSignalDeferred || [];
                    OneSignalDeferred.push(async function(OneSignal) {
                        await OneSignal.init({
                        appId: "272cbe7a-b3d6-4cc1-ad3e-2e19759f912f",
                        safari_web_id: "web.onesignal.auto.38b1a4de-a361-440e-ae28-b71c05790af2",
                        notifyButton: {
                            enable: true,
                        },
                        });
                    });
                `,
            }}
        />
      </head>
      <body className="font-body antialiased">
        <div className="max-w-7xl mx-auto">
          <FirebaseClientProvider>
            <NetworkStatusIndicator />
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
