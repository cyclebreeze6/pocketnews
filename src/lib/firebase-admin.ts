
import admin from 'firebase-admin';

// This is the service account JSON, which should be stored securely as an environment variable.
// In a local environment, this might come from a .env.local file.
// In a deployed environment (like Firebase App Hosting), this should be set as a secret.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Initialize Firebase Admin SDK safely
try {
  // Check if the app is not already initialized
  if (!admin.apps.length) {
    if (serviceAccountJson && serviceAccountJson.length > 2) {
      // Use provided service account JSON if available
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized with provided service account.');
    } else {
      // Fallback to Application Default Credentials (ideal for App Hosting/GCP)
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with Application Default Credentials.');
    }
  }
} catch (error: any) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
}

export const adminSDK = admin;
export const isFirebaseAdminInitialized = admin.apps.length > 0;
