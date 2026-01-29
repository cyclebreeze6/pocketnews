'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '../firebase/error-emitter';
import { FirestorePermissionError } from '../firebase/errors';
import { useToast } from '../hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It logs the error, shows a toast notification, and redirects the user to the homepage.
 */
export function FirebaseErrorListener() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log the full error to the console for debugging.
      console.error('Firestore Permission Error:', error);

      // Show a user-friendly toast message.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to access this. Redirecting to homepage.',
      });

      // Redirect to the homepage.
      router.push('/');
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [router, toast]);

  // This component renders nothing.
  return null;
}
