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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
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

  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all-languages'); // Using a proxy value
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.preferences) {
      const regionPref = userProfile.preferences.region || [];
      // Ensure region preference is always an array for state
      setSelectedRegions(Array.isArray(regionPref) ? regionPref : [regionPref]);
      
      // Use proxy value for empty string from firestore
      setSelectedLanguage(userProfile.preferences.language || 'all-languages');
    } else {
      // Default values if no preferences are set
      setSelectedRegions([]);
      setSelectedLanguage('all-languages');
    }
  }, [userProfile, open]);

  const handleSave = async () => {
    setIsSaving(true);
    const userRef = doc(firestore, 'users', userId);
    
    const preferencesToSave = {
        region: selectedRegions,
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="region-select" variant="outline" className="w-full justify-start font-normal">
                    <div className="line-clamp-1 text-left">
                      {selectedRegions.length > 0 ? selectedRegions.join(', ') : 'Select regions...'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto" align="start">
                  {REGIONS.map(region => (
                    <DropdownMenuCheckboxItem
                      key={region}
                      checked={selectedRegions.includes(region)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRegions(prev => [...prev, region]);
                        } else {
                          setSelectedRegions(prev => prev.filter(r => r !== region));
                        }
                      }}
                    >
                      {region}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
