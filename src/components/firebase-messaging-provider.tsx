
'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '../firebase/messaging';
import { useFirebase } from '../firebase';
import { NotificationPermissionDialog } from './notification-permission-dialog';
import { getMessaging, onMessage } from 'firebase/messaging';
import { useToast } from '../hooks/use-toast';

/**
 * A client component that initializes the push notification setup
 * and conditionally shows a permission dialog.
 */
export function FirebaseMessagingProvider() {
  const { firebaseApp, user } = useFirebase();
  const { permissionStatus, requestPermission } = usePushNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // This effect runs only on the client.
    const audioInstance = new Audio('https://cdn.pixabay.com/audio/2022/10/13/audio_a1932f8c5b.mp3');
    audioInstance.preload = 'auto';
    setAudio(audioInstance);
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseApp) {
      const messaging = getMessaging(firebaseApp);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);

        // Play sound
        if (audio) {
          audio.play().catch(error => console.error("Error playing sound:", error));
        }

        // Show a toast notification
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body || '',
        });
      });

      return () => unsubscribe();
    }
  }, [firebaseApp, toast, audio]);


  useEffect(() => {
    // Show the dialog only if the user is logged in, not anonymous,
    // and hasn't made a decision yet ('default').
    if (user && !user.isAnonymous && permissionStatus === 'default') {
      // Delaying the dialog slightly to not be too intrusive on page load
      const timer = setTimeout(() => {
        setIsDialogOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // If conditions are not met (e.g., user logs out), ensure dialog is closed.
      setIsDialogOpen(false);
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
