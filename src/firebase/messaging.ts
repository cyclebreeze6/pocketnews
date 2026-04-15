
'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from './provider';
import { useEffect, useState, useCallback, useRef } from 'react';

type PermissionStatus = 'default' | 'granted' | 'denied';

const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY?.trim() ?? '';

function hasPushNotificationConfig() {
  return vapidKey.length > 0;
}

/**
 * Requests permission to send push notifications and saves the token if granted.
 * @param {string} userId - The current user's ID.
 */
export async function setupPushNotifications(userId: string): Promise<void> {
  if (!hasPushNotificationConfig()) {
    return;
  }

  const supported = await isSupported();
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser.');
    return;
  }
  
  try {
    const messaging = getMessaging(getApp());
    const firestore = getFirestore();

    // Wait for the service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: registration,
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Save the token to Firestore
      const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', currentToken);
      await setDoc(tokenRef, { 
          token: currentToken,
          createdAt: serverTimestamp() 
      }, { merge: true });
      console.log('FCM token saved to Firestore.');
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }

  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
}

/**
 * A hook to initialize push notification setup for the logged-in user.
 */
export function usePushNotifications() {
  const { user } = useFirebase();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const [isPushSupported, setIsPushSupported] = useState(false);
  const initializedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function detectPushSupport() {
      if (typeof window === 'undefined' || !('Notification' in window) || !hasPushNotificationConfig()) {
        if (isMounted) {
          setIsPushSupported(false);
        }
        return;
      }

      const supported = await isSupported();

      if (!isMounted) {
        return;
      }

      setIsPushSupported(supported);

      if (supported) {
        setPermissionStatus(Notification.permission);
      }
    }

    void detectPushSupport();

    return () => {
      isMounted = false;
    };
  }, []);

  const ensurePushSetup = useCallback(async (userId: string) => {
    if (initializedUserIdRef.current === userId) {
      return;
    }

    initializedUserIdRef.current = userId;
    await setupPushNotifications(userId);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!user || user.isAnonymous || !isPushSupported) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // If permission is granted, proceed to get and save the token.
        await ensurePushSetup(user.uid);
      } else {
        initializedUserIdRef.current = null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, [ensurePushSetup, isPushSupported, user]);

  useEffect(() => {
    if (!user || user.isAnonymous || permissionStatus !== 'granted' || !isPushSupported) {
      if (!user || user.isAnonymous || permissionStatus !== 'granted') {
        initializedUserIdRef.current = null;
      }
      return;
    }

    // If permission is already granted, ensure token is set up on login.
    void ensurePushSetup(user.uid);
  }, [ensurePushSetup, isPushSupported, permissionStatus, user]);

  return {
    permissionStatus,
    requestPermission,
    isPushSupported,
  };
}
