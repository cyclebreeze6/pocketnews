'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
    messaging: Messaging | null;
} {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    const messaging = isSupported ? getMessaging(firebaseApp) : null;
    return getSdks(firebaseApp, messaging);
  }
  
  const app = getApp();
  const messaging = isSupported ? getMessaging(app) : null;
  return getSdks(app, messaging);
}

export function getSdks(firebaseApp: FirebaseApp, messaging: Messaging | null) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    messaging: messaging,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './storage';
export * from './errors';
export * from './error-emitter';
export * from './messaging';
