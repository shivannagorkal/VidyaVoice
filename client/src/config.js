
const rawApiUrl = import.meta.env.VITE_API_URL?.trim?.();

export const API_BASE = rawApiUrl || (import.meta.env.DEV ? "http://localhost:3001" : "");
export const API_CONFIG_ERROR = API_BASE
  ? null
  : "Backend URL is missing. Set VITE_API_URL in Vercel to your deployed server URL.";

export function buildApiUrl(path) {
  if (!API_BASE) {
    throw new Error(API_CONFIG_ERROR);
  }

  return `${API_BASE}${path}`;
}

const firebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const FIREBASE_CONFIG_ERROR = missingFirebaseEnvKeys.length
  ? `Firebase config is incomplete. Add these Vercel env vars: ${missingFirebaseEnvKeys.join(", ")}.`
  : null;
