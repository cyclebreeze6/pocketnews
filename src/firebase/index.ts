
import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp, getAppCheck } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';


// This function should only be called from the server
function initializeFirebaseAdmin() {
  if (!getAdminApps().length) {
    // When running on Google Cloud, the service account credentials will be
    // automatically available.
    return initializeAdminApp();
  }
  return getAdminApp();
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // If we're on the server, we use the Admin SDK
  if (typeof window === 'undefined') {
    const adminApp = initializeFirebaseAdmin();
    return {
      firestore: getAdminFirestore(adminApp),
      // We don't have auth or storage on the server in this context for now
      // These would need to be the admin SDK versions if needed
      auth: null, 
      storage: null,
      firebaseApp: null,
    };
  }

  // If we're on the client, use the client SDK
  if (!getApps().length) {
    let firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized on client, return the SDKs
  return getSdks(getApp());
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
