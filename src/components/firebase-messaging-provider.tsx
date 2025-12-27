'use client';

import { usePushNotifications } from '../firebase/messaging';

/**
 * A client component that initializes the push notification setup.
 * It doesn't render anything to the DOM.
 */
export function FirebaseMessagingProvider() {
  // This hook will request permission and save the token when a user is logged in.
  usePushNotifications();

  return null; // This component does not render anything.
}
