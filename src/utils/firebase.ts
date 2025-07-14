import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYpfQTJsCoW1QVXt9aRUW7BJ-nrGyrBxk",
  authDomain: "webappmarketingard.firebaseapp.com",
  projectId: "webappmarketingard",
  storageBucket: "webappmarketingard.appspot.com",
  messagingSenderId: "257245432172",
  appId: "1:257245432172:web:88d7d34d99139644750b49",
  measurementId: "G-050ZE6F6VB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;