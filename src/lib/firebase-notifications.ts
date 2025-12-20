'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '../firebase';

/**
 * Requests permission to show notifications and saves the FCM token to Firestore.
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the current user.
 * @returns {Promise<boolean>} - True if permission was granted, false otherwise.
 */
export async function requestNotificationPermission(firestore: Firestore, userId: string): Promise<boolean> {
    if (!await isSupported()) {
        console.log("Firebase Messaging is not supported in this browser.");
        return false;
    }
    
    const { firebaseApp } = initializeFirebase();
    const messaging = getMessaging(firebaseApp);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        try {
            const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
            if (currentToken) {
                // Save the token to Firestore
                const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', currentToken);
                await setDoc(tokenRef, { token: currentToken, createdAt: new Date() });
                console.log('FCM Token stored successfully.');
                return true;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return false;
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            return false;
        }
    } else {
        console.log('Unable to get permission to notify.');
        return false;
    }
}

/**
 * Checks if notification permission is already granted.
 * @returns {Promise<boolean>} - True if permission is granted, false otherwise.
 */
export async function isNotificationPermissionGranted(): Promise<boolean> {
     if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
     }
     return false;
}
