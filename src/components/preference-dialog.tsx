
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
import { Label } from './ui/label';
import { useState, useEffect } from 'react';
import { useFirebase } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { REGIONS } from '../lib/constants';
import { Loader2, Globe, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import type { UserProfile } from '../lib/types';
import { cn } from '../lib/utils';

interface PreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userProfile?: UserProfile | null;
}

export function PreferenceDialog({
  open,
  onOpenChange,
  userId,
  userProfile,
}: PreferenceDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      let prefsToLoad: any = null;

      if (user && !user.isAnonymous && userProfile?.preferences) {
        prefsToLoad = userProfile.preferences;
      } else if (user?.isAnonymous) {
        const anonPrefsRaw = localStorage.getItem('anonymousPreferences');
        if (anonPrefsRaw) {
          prefsToLoad = JSON.parse(anonPrefsRaw);
        }
      }

      if (prefsToLoad) {
        const regionPref = prefsToLoad.region || [];
        setSelectedRegions(Array.isArray(regionPref) ? regionPref : [regionPref]);
      } else {
        // Default values for new users
        setSelectedRegions(['Global']);
      }
    }
  }, [userProfile, open, user]);

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev => 
        prev.includes(region)
            ? prev.filter(r => r !== region)
            : [...prev, region]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const preferencesToSave = {
        region: selectedRegions,
    };

    try {
        if (user && !user.isAnonymous && userId) {
            // For logged-in users, update Firestore. The page will update reactively.
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
                preferences: preferencesToSave,
                preferencesSet: true,
            });
            toast({
                title: 'Preferences Saved!',
                description: 'Your personalized feed is being updated.',
            });
        } else {
            // For anonymous users, save to localStorage. The page will react to this state change.
            localStorage.setItem('anonymousPreferences', JSON.stringify(preferencesToSave));
            localStorage.setItem('preferencesSet', 'true');
             toast({
                title: 'Preferences Saved!',
                description: 'Your feed will be updated on the next page load.',
            });
        }

        onOpenChange(false);
        // Force a reload for preference changes to take effect everywhere immediately
        window.location.reload();

    } catch (error) {
        console.error("Failed to save preferences:", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save your preferences. Please try again.'
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalize Your Feed</DialogTitle>
          <DialogDescription>
            Choose the content you want to see. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div>
                <Label className="text-base font-semibold">Regions</Label>
                <p className="text-sm text-muted-foreground mb-4">Select all that apply.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {REGIONS.map(region => (
                        <div
                            key={region}
                            onClick={() => handleRegionToggle(region)}
                            className={cn(
                                "relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all aspect-square flex-col gap-2 text-center",
                                selectedRegions.includes(region) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                        >
                            <Globe className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{region}</span>
                            {selectedRegions.includes(region) && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={isSaving || selectedRegions.length === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
