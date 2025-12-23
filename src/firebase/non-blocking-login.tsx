
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';


type AuthSuccessCallback = (user: User) => void;
type AuthErrorCallback = (error: FirebaseError) => void;


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error: FirebaseError) => {
    console.error("Anonymous sign-in failed:", error);
    // Optionally, you could add global error reporting here
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
    authInstance: Auth, 
    email: string, 
    password: string, 
    displayName: string,
    onSuccess?: AuthSuccessCallback,
    onError?: AuthErrorCallback
): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
        // After creating the user, update their profile with the display name
        await updateProfile(userCredential.user, { displayName });
        onSuccess?.(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError?.(error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
    authInstance: Auth, 
    email: string, 
    password: string,
    onSuccess?: AuthSuccessCallback,
    onError?: AuthErrorCallback
): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
        onSuccess?.(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError?.(error);
    });
}
