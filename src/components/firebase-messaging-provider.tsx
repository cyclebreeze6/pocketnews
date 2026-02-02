
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
    if (typeof window === 'undefined' || isUserLoading) {
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
      } else if (!isProfileLoading && userProfile?.preferencesSet) {
        prefsAreSet = true;
      }

      if (prefsAreSet) {
        const lastSetTimestamp = localStorage.getItem('preferenceSetTimestamp');
        if (lastSetTimestamp) {
          const twelveHoursInMillis = 12 * 60 * 60 * 1000;
          const timeSinceLastSet = new Date().getTime() - parseInt(lastSetTimestamp, 10);
          if (timeSinceLastSet >= twelveHoursInMillis) {
            // It's been more than 12 hours, so show the popup.
            const timer = setTimeout(() => setIsPreferenceDialogOpen(true), 2000);
            return () => clearTimeout(timer);
          }
          // If less than 12 hours, do nothing.
        } else {
          // If prefs are set but there's no timestamp (e.g., first time after update, or cleared cache),
          // just set the timestamp for now and don't show the popup.
          // This will start the 12-hour timer for the next check.
          localStorage.setItem('preferenceSetTimestamp', new Date().getTime().toString());
        }
      } else {
        // If preferences have never been set, show the popup.
        const timer = setTimeout(() => setIsPreferenceDialogOpen(true), 2000);
        return () => clearTimeout(timer);
      }
    };
    
    // We must wait for profile loading to finish before making a decision for logged-in users.
    if ((user && user.isAnonymous) || !isProfileLoading) {
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
