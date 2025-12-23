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

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      if (OneSignal) {
        await OneSignal.init({
          appId: "272cbe7a-b3d6-4cc1-ad3e-2e19759f912f",
          safari_web_id: "web.onesignal.auto.38b1a4de-a361-440e-ae28-b71c05790af2",
          notifyButton: {
            enable: true,
          },
        });
      }
    });
    
  }, []);

  return null;
}
