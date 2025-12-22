'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInitializer() {
  useEffect(() => {
    async function initializeOneSignal() {
      if (typeof window !== 'undefined') {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          allowBell: false,
        });
      }
    }
    initializeOneSignal();
  }, []);

  return null;
}
