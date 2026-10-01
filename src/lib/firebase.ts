import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Messaging instance loader
let messagingPromise: Promise<Messaging | null> | null = null;
export const getSafeMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => {
      if (supported && 'Notification' in window) {
        try {
          return getMessaging(app);
        } catch (e) {
          console.warn('Messaging initialization warning:', e);
          return null;
        }
      }
      return null;
    }).catch(() => null);
  }
  return messagingPromise;
};
