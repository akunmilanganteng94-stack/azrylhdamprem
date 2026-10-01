import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  runTransaction,
  type Timestamp
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBAuN6Yn2U9OwUhNbBolF5x0T4_T3iaCUg",
  authDomain: "azrylstore-7f4e2.firebaseapp.com",
  projectId: "azrylstore-7f4e2",
  storageBucket: "azrylstore-7f4e2.firebasestorage.app",
  messagingSenderId: "542820984224",
  appId: "1:542820984224:web:af283f9c0c4f0bf808f0c5",
  measurementId: "G-EC10M2HLBR"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export type { FirebaseUser, Timestamp };
