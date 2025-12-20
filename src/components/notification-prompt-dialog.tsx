
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
import { BellRing } from 'lucide-react';
import { Button } from './ui/button';

interface NotificationPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  onLater: () => void;
}

export function NotificationPromptDialog({ open, onOpenChange, onAllow, onLater }: NotificationPromptDialogProps) {
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
            Enable push notifications to be the first to know when new content is uploaded. You can change this in settings at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={onLater}>Maybe Later</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onAllow}>Allow Notifications</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
