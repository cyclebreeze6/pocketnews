
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { useFirebase, updateDocumentNonBlocking } from '../firebase';
import { doc } from 'firebase/firestore';
import { LANGUAGES, REGIONS } from '../lib/constants';
import { Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface PreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

type PreferenceType = 'all' | 'region' | 'language';

export function PreferenceDialog({
  open,
  onOpenChange,
  userId,
}: PreferenceDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [preferenceType, setPreferenceType] = useState<PreferenceType>('all');
  const [selectedValue, setSelectedValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if ((preferenceType === 'language' || preferenceType === 'region') && !selectedValue) {
        toast({ variant: 'destructive', title: 'Please select an option.' });
        return;
    }
    setIsSaving(true);
    const userRef = doc(firestore, 'users', userId);
    
    const preferencesToSave = {
        type: preferenceType,
        value: preferenceType === 'all' ? '' : selectedValue,
    }

    updateDocumentNonBlocking(userRef, {
        preferences: preferencesToSave,
        preferencesSet: true,
    });
    
    setIsSaving(false);
    toast({ title: 'Preferences Saved!', description: "Your feed will now be personalized."});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalize Your Feed</DialogTitle>
          <DialogDescription>
            Choose the content you want to see. You can change this later in settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <RadioGroup
            value={preferenceType}
            onValueChange={(value: PreferenceType) => {
              setPreferenceType(value);
              setSelectedValue(''); // Reset value when type changes
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All Content</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="language" id="language" />
              <Label htmlFor="language">By Language</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="region" id="region" />
              <Label htmlFor="region">By Region</Label>
            </div>
          </RadioGroup>

          {preferenceType === 'language' && (
            <div className="grid gap-2 animate-in fade-in">
              <Label htmlFor="language-select">Select Language</Label>
              <Select onValueChange={setSelectedValue} value={selectedValue}>
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="Choose a language..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {preferenceType === 'region' && (
            <div className="grid gap-2 animate-in fade-in">
              <Label htmlFor="region-select">Select Region</Label>
              <Select onValueChange={setSelectedValue} value={selectedValue}>
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
          )}
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
