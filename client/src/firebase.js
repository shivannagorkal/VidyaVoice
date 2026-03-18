import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { FIREBASE_CONFIG_ERROR } from "./config";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = FIREBASE_CONFIG_ERROR ? null : initializeApp(firebaseConfig);
const auth = app ? getAuth(app) : null;
const provider = auth ? new GoogleAuthProvider() : null;

export { auth, provider, signInWithPopup, signOut, FIREBASE_CONFIG_ERROR };
