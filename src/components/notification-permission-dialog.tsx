
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { BellRing } from 'lucide-react';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
}

export function NotificationPermissionDialog({
  open,
  onOpenChange,
  onAllow,
}: NotificationPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-6 w-6" />
            Enable Notifications
          </DialogTitle>
          <DialogDescription>
            Stay up-to-date with the latest videos from your favorite
            categories. We'll send you a notification when new content is
            available.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={onAllow}>Allow Notifications</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
