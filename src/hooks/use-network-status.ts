'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to track the online status of the browser.
 * @returns {boolean} - True if the browser is online, false otherwise.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // This code only runs on the client.
    if (typeof window !== 'undefined' && typeof navigator.onLine !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
