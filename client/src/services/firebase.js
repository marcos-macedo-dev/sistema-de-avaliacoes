// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGZFcyiAX2siRTgRCEWa13EaWtzvxJ0p0",
  authDomain: "avalia-22c72.firebaseapp.com",
  projectId: "avalia-22c72",
  storageBucket: "avalia-22c72.firebasestorage.app",
  messagingSenderId: "894950542554",
  appId: "1:894950542554:web:4919b4b5ce2b20a48369e3",
  measurementId: "G-E4H8KSES6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
