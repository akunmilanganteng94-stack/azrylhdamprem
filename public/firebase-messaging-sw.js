// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBAuN6Yn2U9OwUhNbBolF5x0T4_T3iaCUg",
  authDomain: "azrylstore-7f4e2.firebaseapp.com",
  projectId: "azrylstore-7f4e2",
  storageBucket: "azrylstore-7f4e2.firebasestorage.app",
  messagingSenderId: "542820984224",
  appId: "1:542820984224:web:af283f9c0c4f0bf808f0c5",
  measurementId: "G-EC10M2HLBR"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'AZRYLPREM Notifikasi';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Ada update status baru pada akun Anda.',
      icon: '/icon-192.png',
      badge: '/badge.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[firebase-messaging-sw.js] Firebase SW initialization error:', e);
}
