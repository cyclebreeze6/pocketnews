
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
import { LANGUAGES, REGIONS } from '../lib/constants';
import { Loader2, Globe, Languages, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import type { UserProfile } from '../lib/types';
import { cn } from '../lib/utils';
import { Checkbox } from './ui/checkbox';


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
  const [selectedLanguage, setSelectedLanguage] = useState('all-languages'); // Using a proxy value
  const [isSaving, setIsSaving] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    if (open) {
      const anonPrefsRaw = localStorage.getItem('anonymousPreferences');
      let prefsToLoad: any = null;

      if (user && !user.isAnonymous && userProfile?.preferences) {
        prefsToLoad = userProfile.preferences;
      } else if (anonPrefsRaw) {
        prefsToLoad = JSON.parse(anonPrefsRaw);
      }

      if (prefsToLoad) {
        const regionPref = prefsToLoad.region || [];
        setSelectedRegions(Array.isArray(regionPref) ? regionPref : [regionPref]);
        setSelectedLanguage(prefsToLoad.language || 'all-languages');
      } else {
        // Default values for new users
        setSelectedRegions(['Global']);

        const langMap: { [key: string]: string } = {
          en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish',
          pt: 'Portuguese', sw: 'Swahili', de: 'German',
          zh: 'Chinese', hi: 'Hindi', ja: 'Japanese', ko: 'Korean',
          th: 'Thai', vi: 'Vietnamese'
        };
        const browserLangCode = navigator.language.split('-')[0];
        const suggestedLanguage = langMap[browserLangCode];

        if (suggestedLanguage && LANGUAGES.includes(suggestedLanguage)) {
          setSelectedLanguage(suggestedLanguage);
        } else {
          setSelectedLanguage('all-languages');
        }
      }
    }
  }, [userProfile, open, user]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (dontAskAgain) {
        localStorage.setItem('hidePreferencePopup', 'true');
      }
    }
    onOpenChange(isOpen);
  };

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev => 
        prev.includes(region)
            ? prev.filter(r => r !== region)
            : [...prev, region]
    );
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const preferencesToSave = {
        region: selectedRegions,
        language: selectedLanguage === 'all-languages' ? '' : selectedLanguage,
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
            // For anonymous users, save to localStorage and reload the page.
            localStorage.setItem('anonymousPreferences', JSON.stringify(preferencesToSave));
            localStorage.setItem('preferencesSet', 'true');
            toast({
                title: 'Preferences Saved!',
                description: 'Your feed will be updated.',
            });
            // Reload to apply localStorage changes across the app
            window.location.reload();
        }

        if (dontAskAgain) {
            localStorage.setItem('hidePreferencePopup', 'true');
        }

        onOpenChange(false);

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <div>
                <Label className="text-base font-semibold">Language</Label>
                <p className="text-sm text-muted-foreground mb-4">Choose your preferred language.</p>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div
                        key="all-languages"
                        onClick={() => handleLanguageSelect('all-languages')}
                        className={cn(
                            "relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all aspect-square flex-col gap-2 text-center",
                            selectedLanguage === 'all-languages' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        )}
                    >
                        <Languages className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm font-medium">All Languages</span>
                        {selectedLanguage === 'all-languages' && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    {LANGUAGES.map(lang => (
                        <div
                            key={lang}
                            onClick={() => handleLanguageSelect(lang)}
                            className={cn(
                                "relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all aspect-square flex-col gap-2 text-center",
                                selectedLanguage === lang ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                        >
                            <Languages className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{lang}</span>
                            {selectedLanguage === lang && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <div className="flex items-center space-x-2 pt-2 sm:pt-0">
            <Checkbox id="dont-ask" checked={dontAskAgain} onCheckedChange={(checked) => setDontAskAgain(Boolean(checked))} />
            <Label htmlFor="dont-ask" className="text-xs text-muted-foreground">Don't ask me again</Label>
          </div>
          <Button type="button" onClick={handleSave} disabled={isSaving || selectedRegions.length === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
