'use server';

import admin from 'firebase-admin';

// This is the service account JSON, which should be stored securely as an environment variable.
// In a local environment, this might come from a .env.local file.
// In a deployed environment (like Firebase App Hosting), this should be set as a secret.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// Initialize Firebase Admin SDK safely
try {
  if (!admin.apps.length) {
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set. Push notifications will be disabled.');
    }
  }
} catch (error: any) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
}

export const adminSDK = admin;
export const isFirebaseAdminInitialized = admin.apps.length > 0;
