'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { BellRing, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '../firebase';
import { collection } from 'firebase/firestore';
import type { Category } from '../lib/types';
import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface NotificationPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: (selectedCategories: string[]) => void;
  onLater: () => void;
}

export function NotificationPromptDialog({ open, onOpenChange, onAllow, onLater }: NotificationPromptDialogProps) {
  const { firestore } = useFirebase();
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Get Notified of New Videos</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Enable notifications to know when new content is uploaded. Choose which categories to follow.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
            <h4 className="font-medium mb-3 text-center">I want to be notified about...</h4>
            {isLoading ? (
                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto pr-2">
                    {categories?.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`cat-${category.id}`} 
                                checked={selectedCategories.includes(category.name)}
                                onCheckedChange={() => handleCategoryToggle(category.name)}
                            />
                            <Label htmlFor={`cat-${category.id}`} className="font-normal cursor-pointer">{category.name}</Label>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={onLater}>Maybe Later</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={() => onAllow(selectedCategories)}>Allow Notifications</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
