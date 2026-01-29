'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { getRegionFromLocation } from '../app/actions/get-region-from-location';
import { useToast } from '../hooks/use-toast';
import { useFirebase } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface LocationConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = 'idle' | 'detecting' | 'detected' | 'denied' | 'error' | 'saving';

export function LocationConfirmationDialog({ open, onOpenChange }: LocationConfirmationDialogProps) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>('idle');
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    // Reset state for next time it opens
    setTimeout(() => {
        setStatus('idle');
        setDetectedRegion(null);
    }, 300);
  };

  const handleUseGlobal = () => {
    // We just close it. The 4-hour timer will trigger it again later if prefs are not set.
    // If the user wants to permanently dismiss, they can set prefs manually.
    handleClose();
  };
  
  const handleSavePreference = async (region: string) => {
    if (!user || user.isAnonymous) {
        toast({ variant: 'destructive', title: 'You must be logged in to save preferences.' });
        return;
    }
    setStatus('saving');
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
        // The `preferences` object might not exist, so we set the whole object
        // instead of using dot notation for a nested field.
        await updateDoc(userRef, {
            preferences: { region: [region] },
            preferencesSet: true,
        });
        toast({
            title: 'Region preference saved!',
            description: `Your content will be tailored for ${region}.`,
        });
        handleClose();
        window.location.reload();
    } catch (error) {
        console.error("Error saving preference:", error);
        toast({ variant: 'destructive', title: 'Could not save preference.' });
        setStatus('detected'); // Go back to detected state on error
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const region = await getRegionFromLocation({ lat: latitude, lng: longitude });
          if (region) {
            setDetectedRegion(region);
            setStatus('detected');
          } else {
            setStatus('error');
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
          setStatus('error');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      }
    );
  };

  const renderContent = () => {
    switch (status) {
      case 'detecting':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Detecting your location...</p>
            <p className="text-xs text-muted-foreground">(Please approve the location request in your browser)</p>
          </div>
        );
      case 'saving':
         return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Saving your preference...</p>
          </div>
        );
      case 'detected':
        return (
          <>
            <DialogHeader className="items-center">
              <DialogTitle>Location Detected!</DialogTitle>
              <DialogDescription className="text-center pt-4">
                We think you're in <span className="font-bold text-primary">{detectedRegion}</span>.
                <br />
                Would you like to see news from this region?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button onClick={() => handleSavePreference(detectedRegion!)}>Yes, use {detectedRegion}</Button>
              <Button variant="outline" onClick={handleUseGlobal}>No, Show Global News</Button>
            </DialogFooter>
          </>
        );
      case 'denied':
        return (
             <>
                <DialogHeader className="items-center">
                    <DialogTitle>Location Access Denied</DialogTitle>
                    <DialogDescription className="text-center">
                        You've denied location access. We'll show you the global feed. You can change your preferences at any time in the settings.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleClose}>Okay</Button>
                </DialogFooter>
            </>
        );
     case 'error':
         return (
             <>
                <DialogHeader className="items-center">
                    <DialogTitle>Could Not Detect Location</DialogTitle>
                    <DialogDescription className="text-center">
                       We were unable to determine your location. We'll show you the global feed for now.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleClose}>Okay</Button>
                </DialogFooter>
            </>
         );
      case 'idle':
      default:
        return (
          <>
            <DialogHeader className="items-center">
              <DialogTitle>Personalize Your News Feed</DialogTitle>
              <DialogDescription className="text-center">
                Allow location access to see news from your region, or continue with the global feed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center">
                <MapPin className="h-16 w-16 mx-auto text-primary" />
            </div>
            <DialogFooter className="sm:justify-center">
              <Button size="lg" onClick={handleDetectLocation}>Use My Location</Button>
              <Button size="lg" variant="secondary" onClick={handleUseGlobal}>Show Me Everything</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
