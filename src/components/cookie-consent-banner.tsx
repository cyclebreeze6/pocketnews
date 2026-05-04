
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Cookie } from 'lucide-react';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        setShowBanner(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie_consent', 'true');
      setShowBanner(false);
    } catch (error) {
      console.error("Could not write to localStorage:", error);
      setShowBanner(false); // Hide banner even if localStorage fails
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[60] bg-secondary p-4 text-secondary-foreground shadow-lg animate-in slide-in-from-bottom sm:bottom-0">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cookie className="h-6 w-6 shrink-0" />
          <p className="text-sm">
            We use cookies and local storage to enhance your experience and personalize content.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
