
'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '../firebase/messaging';
import { useFirebase } from '../firebase';
import { NotificationPermissionDialog } from './notification-permission-dialog';

/**
 * A client component that initializes the push notification setup
 * and conditionally shows a permission dialog.
 */
export function FirebaseMessagingProvider() {
  const { user } = useFirebase();
  const { permissionStatus, requestPermission } = usePushNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Show the dialog only if the user is logged in, not anonymous,
    // and hasn't made a decision yet ('default').
    if (user && !user.isAnonymous && permissionStatus === 'default') {
      // Add a small delay to not overwhelm the user immediately on login.
      const timer = setTimeout(() => {
        setIsDialogOpen(true);
      }, 5000); // 5-second delay

      return () => clearTimeout(timer);
    }
  }, [user, permissionStatus]);

  const handleAllow = () => {
    requestPermission();
    setIsDialogOpen(false);
  };

  return (
    <NotificationPermissionDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      onAllow={handleAllow}
    />
  );
}
