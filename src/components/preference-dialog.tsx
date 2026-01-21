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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState, useEffect } from 'react';
import { useFirebase, updateDocumentNonBlocking } from '../firebase';
import { doc } from 'firebase/firestore';
import { LANGUAGES, REGIONS } from '../lib/constants';
import { Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import type { UserProfile } from '../lib/types';

interface PreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userProfile?: UserProfile | null;
}

export function PreferenceDialog({
  open,
  onOpenChange,
  userId,
  userProfile,
}: PreferenceDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [selectedRegion, setSelectedRegion] = useState('Global');
  const [selectedLanguage, setSelectedLanguage] = useState('all-languages'); // Using a proxy value
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.preferences) {
      setSelectedRegion(userProfile.preferences.region || 'Global');
      // Use proxy value for empty string from firestore
      setSelectedLanguage(userProfile.preferences.language || 'all-languages');
    } else {
      // Default values if no preferences are set
      setSelectedRegion('Global');
      setSelectedLanguage('all-languages');
    }
  }, [userProfile, open]);

  const handleSave = async () => {
    setIsSaving(true);
    const userRef = doc(firestore, 'users', userId);
    
    const preferencesToSave = {
        region: selectedRegion,
        // Convert proxy value back to empty string for storage
        language: selectedLanguage === 'all-languages' ? '' : selectedLanguage,
    };

    updateDocumentNonBlocking(userRef, {
        preferences: preferencesToSave,
        preferencesSet: true,
    });
    
    setIsSaving(false);
    onOpenChange(false);
    toast({
        title: 'Preferences Updated!',
        description: 'Your content feed will now be personalized.',
    });
    // Reload the page to apply the new preferences
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalize Your Feed</DialogTitle>
          <DialogDescription>
            Choose the content you want to see. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
           <div className="grid gap-2">
              <Label htmlFor="region-select">Filter by Region</Label>
              <Select onValueChange={setSelectedRegion} value={selectedRegion}>
                <SelectTrigger id="region-select">
                  <SelectValue placeholder="Choose a region..." />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language-select">Filter by Language</Label>
              <Select onValueChange={setSelectedLanguage} value={selectedLanguage}>
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-languages">All Languages</SelectItem>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
