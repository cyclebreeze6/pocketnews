'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '../firebase/messaging';
import { useFirebase, useDoc, useMemoFirebase } from '../firebase';
import { NotificationPermissionDialog } from './notification-permission-dialog';
import { getMessaging, onMessage } from 'firebase/messaging';
import { useToast } from '../hooks/use-toast';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';
import { PreferenceDialog } from './preference-dialog';

/**
 * A client component that initializes the push notification setup
 * and conditionally shows a permission dialog.
 */
export function FirebaseMessagingProvider() {
  const { firebaseApp, user, firestore } = useFirebase();
  const { permissionStatus, requestPermission } = usePushNotifications();
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false);
  const { toast } = useToast();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

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
    // Show the notification permission dialog
    if (user && !user.isAnonymous && permissionStatus === 'default') {
      const timer = setTimeout(() => {
        setIsNotificationDialogOpen(true);
      }, 5000); // Delay this one a bit more
      return () => clearTimeout(timer);
    } else {
      setIsNotificationDialogOpen(false);
    }
  }, [user, permissionStatus]);
  
  useEffect(() => {
    // Show the preference dialog after a delay if the user hasn't opted out.
    const hidePreferencePopup = localStorage.getItem('hidePreferencePopup');
    if (user && !user.isAnonymous && userProfile && hidePreferencePopup !== 'true') {
      const timer = setTimeout(() => {
        setIsPreferenceDialogOpen(true);
      }, 2000); // 2-second delay
      return () => clearTimeout(timer);
    } else {
      setIsPreferenceDialogOpen(false);
    }
  }, [user, userProfile]);

  const handleAllowNotifications = () => {
    requestPermission();
    setIsNotificationDialogOpen(false);
  };

  return (
    <>
        <NotificationPermissionDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
        onAllow={handleAllowNotifications}
        />
        {user && !user.isAnonymous && (
            <PreferenceDialog
            open={isPreferenceDialogOpen}
            onOpenChange={setIsPreferenceDialogOpen}
            userId={user.uid}
            userProfile={userProfile}
            />
        )}
    </>
  );
}
