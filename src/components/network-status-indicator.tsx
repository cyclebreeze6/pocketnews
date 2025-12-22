'use client';

import { useNetworkStatus } from '../hooks/use-network-status';
import { Button } from './ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-4 flex items-center justify-center shadow-lg animate-in slide-in-from-bottom"
    >
      <div className="flex items-center gap-4">
        <WifiOff className="h-6 w-6" />
        <div>
          <p className="font-bold">You are offline</p>
          <p className="text-sm">Please check your network connection.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="ml-4 bg-destructive hover:bg-destructive/90 border-destructive-foreground/50 hover:border-destructive-foreground text-destructive-foreground"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
