import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth, db, googleProvider, getSafeMessaging } from '../lib/firebase';
import { UserProfile, SystemSettings, ToastItem } from '../types';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  userProfile: UserProfile | null;
  profile: UserProfile | null;
  settings: SystemSettings;
  loading: boolean;
  isAdmin: boolean;
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  removeToast: (id: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; unauthorizedDomain?: string; error?: string }>;
  logout: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'AZRYLPREM',
  depositOpen: true,
  minDeposit: 1000,
  maxDeposit: 1000000,
  danaNumber: '085786683784',
  danaName: 'JEJE',
  qrisUrl: 'https://api.zyvor.my.id/files/16e4dbd0fc28a8031b247897df219df5.jpeg',
  whatsappChannel: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
  promoUrl: 'https://www.azryl.my.id/',
  apkUrl: '',
  apkName: 'AZRYLPREM Mobile',
  apkVersion: 'v1.0.0',
  amApiEndpoint: 'https://api.zyvor.my.id/api/am/bulkv3',
  hdApiEndpoint: 'https://api.zyvor.my.id/api/imagehd/upscalev2',
  amApi: 'https://api.zyvor.my.id/api/am/bulkv3',
  hdApi: 'https://api.zyvor.my.id/api/imagehd/upscalev2',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OWNER_EMAIL = 'apriliansyahazril10@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(type === 'error' ? 'AZRYLPREM - Perhatian' : 'AZRYLPREM', {
            body: message,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%237c3aed"/%3E%3Cpath d="M50 20 L75 80 L60 80 L54 64 L46 64 L40 80 L25 80 Z" fill="%23fff"/%3E%3C/svg%3E',
          });
        } catch (e) {
          // ignore notification error
        }
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync System Settings in real time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          amApiEndpoint: data.amApiEndpoint || data.amApi || DEFAULT_SETTINGS.amApiEndpoint,
          hdApiEndpoint: data.hdApiEndpoint || data.hdApi || DEFAULT_SETTINGS.hdApiEndpoint,
        } as SystemSettings);
      } else {
        setDoc(doc(db, 'settings', 'system'), DEFAULT_SETTINGS).catch(console.error);
      }
    });

    return () => unsub();
  }, []);

  // Sync Auth User & User Profile
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);

        profileUnsub = onSnapshot(userDocRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const isAdminRole = data.role === 'admin' || currentUser.email === OWNER_EMAIL;
            
            if (currentUser.email === OWNER_EMAIL && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
            }

            setUserProfile({
              uid: currentUser.uid,
              name: data.name || currentUser.displayName || 'Member AZRYL',
              email: currentUser.email || '',
              role: isAdminRole ? 'admin' : (data.role || 'user'),
              balance: Number(data.balance) || 0,
              totalSpent: Number(data.totalSpent) || 0,
              totalOrders: Number(data.totalOrders || data.orderCount) || 0,
              orderCount: Number(data.totalOrders || data.orderCount) || 0,
              xp: Number(data.xp) || 0,
              fcmToken: data.fcmToken || '',
              createdAt: data.createdAt,
              lastSeen: data.lastSeen,
            });
          } else {
            const isOwner = currentUser.email === OWNER_EMAIL;
            const newProfile: any = {
              name: currentUser.displayName || 'Member AZRYL',
              email: currentUser.email || '',
              role: isOwner ? 'admin' : 'user',
              balance: 0,
              totalSpent: 0,
              totalOrders: 0,
              orderCount: 0,
              xp: 25,
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile({
              uid: currentUser.uid,
              ...newProfile,
            });
          }
          setLoading(false);
        });

        updateDoc(userDocRef, { lastSeen: serverTimestamp() }).catch(() => {});
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile({
          uid: user.uid,
          name: data.name || user.displayName || 'Member AZRYL',
          email: user.email || '',
          role: data.role === 'admin' || user.email === OWNER_EMAIL ? 'admin' : (data.role || 'user'),
          balance: Number(data.balance) || 0,
          totalSpent: Number(data.totalSpent) || 0,
          totalOrders: Number(data.totalOrders || data.orderCount) || 0,
          orderCount: Number(data.totalOrders || data.orderCount) || 0,
          xp: Number(data.xp) || 0,
          fcmToken: data.fcmToken || '',
          createdAt: data.createdAt,
          lastSeen: data.lastSeen,
        });
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      showToast('Berhasil masuk ke AZRYLPREM 👋', 'success');
    } catch (error: any) {
      setLoading(false);
      let msg = 'Gagal masuk. Periksa email dan password.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Email atau password salah!';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan. Harap tunggu beberapa saat.';
      }
      showToast(msg, 'error');
      throw error;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      const isOwner = email.trim() === OWNER_EMAIL;
      
      const profileData: any = {
        name: name.trim(),
        email: email.trim(),
        role: isOwner ? 'admin' : 'user',
        balance: 0,
        totalSpent: 0,
        totalOrders: 0,
        orderCount: 0,
        xp: 50,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), profileData);
      showToast(`Selamat datang di AZRYLPREM, ${name.trim()}! 🎉`, 'success');
    } catch (error: any) {
      setLoading(false);
      let msg = 'Gagal mendaftar.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Email sudah terdaftar. Silakan login.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password terlalu lemah (minimal 6 karakter).';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Format email tidak valid.';
      }
      showToast(msg, 'error');
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; unauthorizedDomain?: string; error?: string }> => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const isOwner = res.user.email === OWNER_EMAIL;
      const ref = doc(db, 'users', res.user.uid);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        await setDoc(ref, {
          name: res.user.displayName || 'Member AZRYL',
          email: res.user.email || '',
          role: isOwner ? 'admin' : 'user',
          balance: 0,
          totalSpent: 0,
          totalOrders: 0,
          orderCount: 0,
          xp: 50,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        });
      } else if (isOwner && snap.data().role !== 'admin') {
        await updateDoc(ref, { role: 'admin' });
      }

      showToast(`Selamat datang ${res.user.displayName || ''}!`, 'success');
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      const code = error?.code || '';
      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        console.warn('Firebase Auth: domain belum diizinkan di Firebase Console:', domain);
        showToast(
          `Domain (${domain}) belum di-whitelist di Firebase Console. Silakan gunakan Form Login Email & Password.`,
          'warning',
          7000
        );
        return {
          success: false,
          unauthorizedDomain: domain,
          error: `Domain (${domain}) belum terdaftar di Authorized Domains Firebase Console.`
        };
      } else if (code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Popup login ditutup.' };
      } else {
        const errorMsg = error?.message || 'Login dengan Google gagal.';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showToast('Anda telah keluar dari akun.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Browser ini tidak mendukung notifikasi push.', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Notifikasi AZRYLPREM telah diaktifkan! 🔔', 'success');

        const messaging = await getSafeMessaging();
        if (messaging && user) {
          try {
            const token = await getToken(messaging);
            if (token) {
              await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
            }
          } catch (tokenErr) {
            console.log('FCM Token generation fallback:', tokenErr);
          }
        }
        return true;
      } else {
        showToast('Izin notifikasi ditolak oleh pengguna.', 'warning');
        return false;
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      showToast('Gagal meminta izin notifikasi.', 'error');
      return false;
    }
  };

  const isAdmin = userProfile?.role === 'admin' || user?.email === OWNER_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        userProfile,
        profile: userProfile,
        settings,
        loading,
        isAdmin,
        toasts,
        showToast,
        removeToast,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        requestNotificationPermission,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
