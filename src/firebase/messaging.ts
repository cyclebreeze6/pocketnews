
'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from './provider';
import { useEffect, useState, useCallback } from 'react';

type PermissionStatus = 'default' | 'granted' | 'denied';

/**
 * Requests permission to send push notifications and saves the token if granted.
 * @param {string} userId - The current user's ID.
 */
export async function setupPushNotifications(userId: string): Promise<void> {
  const supported = await isSupported();
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser.');
    return;
  }
  
  try {
    const messaging = getMessaging(getApp());
    const firestore = getFirestore();

    if (!process.env.NEXT_PUBLIC_VAPID_KEY) {
      console.error('VAPID key is not set. Cannot get FCM token.');
      return;
    }

    // Wait for the service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        serviceWorkerRegistration: registration,
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Save the token to Firestore
      const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', currentToken);
      await setDoc(tokenRef, { 
          token: currentToken,
          createdAt: serverTimestamp() 
      });
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

  useEffect(() => {
    // This effect runs only on the client.
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!user || user.isAnonymous) return;

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // If permission is granted, proceed to get and save the token.
        await setupPushNotifications(user.uid);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, [user]);

  useEffect(() => {
    // If permission is already granted, ensure token is set up on login.
    if (user && !user.isAnonymous && permissionStatus === 'granted') {
      setupPushNotifications(user.uid);
    }
  }, [user, permissionStatus]);

  return { permissionStatus, requestPermission };
}
