'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // If we're on the client, use the client SDK
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      let firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }
    // If already initialized on client, return the SDKs
    return getSdks(getApp());
  }

  // On the server, we return null for client SDKs.
  // Server-specific flows will initialize the Admin SDK themselves.
  return {
    firebaseApp: null,
    auth: null, 
    firestore: null,
    storage: null,
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
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