// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// "Default" Firebase app (important for initialization)
firebase.initializeApp({
    apiKey: "AIzaSyBF491cj4zNfYzX2QfvnLjvmWq3nRKHhpk",
    authDomain: "studio-7985035708-93893.firebaseapp.com",
    projectId: "studio-7985035708-93893",
  storageBucket: "studio-7985035708-93893.firebasestorage.app",
    messagingSenderId: "56161195034",
    appId: "1:56161195034:web:c05d8c96a170d17afbada3"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
    sound: "https://cdn.pixabay.com/audio/2022/03/15/audio_221a7a3e75.mp3"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
