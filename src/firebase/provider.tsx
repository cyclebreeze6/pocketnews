
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '../components/FirebaseErrorListener'
import { setDocumentNonBlocking } from './non-blocking-updates';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Ensures a user document exists in Firestore. Creates it if it doesn't.
 * Includes special logic to grant admin rights to the first user.
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth user object.
 */
const ensureUserDocument = async (firestore: Firestore, user: User) => {
  if (!user) return;
  const userRef = doc(firestore, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Logic to make a specific user an admin automatically.
      const isDesignatedAdmin = user.email === 'valentinoboss18@gmail.com';

      // Document doesn't exist, so create it.
      const newUserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous User',
        isAdmin: isDesignatedAdmin,
        isCreator: isDesignatedAdmin, // Also make them a creator
        avatar: user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`,
        preferredCategories: [], // Initialize with empty array
      };
      
      // Use setDoc here to ensure the document exists before proceeding.
      await setDoc(userRef, newUserProfile, { merge: true });

      // If they are the designated admin, also add them to the DBAC collection
      if (isDesignatedAdmin) {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        // Use setDoc here as well for initial setup reliability.
        await setDoc(adminRoleRef, { grantedAt: serverTimestamp() });
      }
    }
  } catch (error) {
    console.error("Error ensuring user document:", error);
    // Handle or log the error appropriately
  }
};


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !firestore) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => { // Auth state determined
         if (firebaseUser) {
          // When a user logs in, ensure their document exists in Firestore.
          await ensureUserDocument(firestore, firebaseUser);
        }
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth, firestore]); // Depends on the auth and firestore instances

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
    const { storage } = useFirebase();
    return storage;
}

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
