import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCEiXY9U0g96-XEShJ7n_d5QLjyJiar1YY",
  authDomain: "cheer-et.firebaseapp.com",
  projectId: "cheer-et",
  storageBucket: "cheer-et.firebasestorage.app",
  messagingSenderId: "228115400890",
  appId: "1:228115400890:web:6f9b0af9123dc4d7d5da83"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);