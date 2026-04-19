import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAYbUy4UBkXgRgo3JbTwJN7fGnnYmZ-yPA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mindcompanion---dementia.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mindcompanion---dementia",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mindcompanion---dementia.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "650041236893",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:650041236893:web:0243935abc2f782b41e374"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
