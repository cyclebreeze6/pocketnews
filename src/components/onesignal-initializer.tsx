'use client';

import { useEffect } from 'react';

// Extend the Window interface to include OneSignal properties
declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export default function OneSignalInitializer() {
  useEffect(() => {
    // Only run this logic on the client-side
    if (typeof window === 'undefined') {
      return;
    }

    // This is the production domain configured in OneSignal
    const productionDomain = 'pocketnewslive.tv';
    
    // Only initialize OneSignal if we are on the configured production domain
    if (window.location.hostname === productionDomain) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        if (OneSignal) {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
            allowBell: false,
          });
        }
      });
    } else {
      console.log('OneSignal initialization skipped: not on production domain.');
    }
  }, []);

  return null;
}
