// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "housesale-280d2.firebaseapp.com",
  projectId: "housesale-280d2",
  storageBucket: "housesale-280d2.firebasestorage.app",
  messagingSenderId: "830631280917",
  appId: "1:830631280917:web:2b0e18406f9506fb6aa91c",
  measurementId: "G-S8PLNRF2VR"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);