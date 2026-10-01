import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyBAuN6Yn2U9OwUhNbBolF5x0T4_T3iaCUg",
  authDomain: "azrylstore-7f4e2.firebaseapp.com",
  projectId: "azrylstore-7f4e2",
  storageBucket: "azrylstore-7f4e2.firebasestorage.app",
  messagingSenderId: "542820984224",
  appId: "1:542820984224:web:af283f9c0c4f0bf808f0c5",
  measurementId: "G-EC10M2HLBR",
};

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
