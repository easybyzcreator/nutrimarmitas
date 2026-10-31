import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxnLxCz1o6BXckRkUaAwZRnWlzQfTwFGI",
  authDomain: "app-nutrimarmitas.firebaseapp.com",
  projectId: "app-nutrimarmitas",
  storageBucket: "app-nutrimarmitas.firebasestorage.app",
  messagingSenderId: "733108404333",
  appId: "1:733108404333:web:2ee02edab6ae357d11ff64",
  measurementId: "G-E99B9B0CLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics not initialized:", e);
      }
    }
  }).catch(() => {});
}

