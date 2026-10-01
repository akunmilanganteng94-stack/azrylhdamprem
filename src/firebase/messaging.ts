import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './config';

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser environment.');
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted.');
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      // VAPID key if configured, or default
    });
    return token;
  } catch (err) {
    console.warn('Failed to retrieve notification token:', err);
    return null;
  }
}

export async function setupForegroundMessageListener(callback: (payload: any) => void) {
  try {
    const supported = await isSupported();
    if (!supported) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
      // Also show native Notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || 'AZRYLPREM Notifikasi';
        const options = {
          body: payload.notification?.body || payload.data?.body || '',
          icon: '/favicon.ico'
        };
        try {
          new Notification(title, options);
        } catch (e) {
          // ignore notification constructor failure
        }
      }
    });
  } catch (err) {
    console.warn('Setup foreground message error:', err);
    return () => {};
  }
}
