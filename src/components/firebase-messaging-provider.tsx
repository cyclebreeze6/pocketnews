
'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePushNotifications } from '../firebase/messaging';
import { useFirebase, useDoc, useMemoFirebase, useUser } from '../firebase';
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
  const { firebaseApp, user, firestore, isUserLoading } = useFirebase();
  const { permissionStatus, requestPermission } = usePushNotifications();
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false);
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseApp) {
      const messaging = getMessaging(firebaseApp);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);

        // Show a toast notification
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body || '',
        });
      });

      return () => unsubscribe();
    }
  }, [firebaseApp, toast]);


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
    // This effect should only run on the client after hydration
    if (typeof window === 'undefined') {
      return;
    }

    const checkAndShowPopup = () => {
      // "Don't ask again" is the highest priority.
      const hidePreferencePopup = localStorage.getItem('hidePreferencePopup');
      if (hidePreferencePopup === 'true') {
        return;
      }

      let prefsAreSet = false;
      if (user?.isAnonymous) {
        prefsAreSet = !!localStorage.getItem('anonymousPreferences');
      } else if (userProfile?.preferencesSet) {
        prefsAreSet = true;
      }

      // Only show the popup if preferences have never been set.
      if (!prefsAreSet) {
        const timer = setTimeout(() => setIsPreferenceDialogOpen(true), 2000);
        return () => clearTimeout(timer);
      }
    };
    
    // We must wait for auth and profile loading to finish before making a decision.
    if (!isUserLoading && !isProfileLoading) {
        checkAndShowPopup();
    }

  }, [user, userProfile, isUserLoading, isProfileLoading]);


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
        <PreferenceDialog
        open={isPreferenceDialogOpen}
        onOpenChange={setIsPreferenceDialogOpen}
        userId={user?.uid || null}
        userProfile={userProfile}
        />
    </>
  );
}
