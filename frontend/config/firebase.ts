import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - LIVE
const firebaseConfig = {
  apiKey: "AIzaSyAzSQfxt07X2oVEZmE8cdFw-OzG7BHWnJc",
  authDomain: "neethub0ai.firebaseapp.com",
  projectId: "neethub0ai",
  storageBucket: "neethub0ai.firebasestorage.app",
  messagingSenderId: "249106354442",
  appId: "1:249106354442:web:bdd48595885ae02fc86af3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;