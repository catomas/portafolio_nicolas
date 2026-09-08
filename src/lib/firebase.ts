import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/** Función pura testeable: devuelve los nombres de variables ausentes o vacías (Req 1.6). */
export function findMissingConfigVars(
  env: Record<string, string | undefined>,
): string[] {
  return REQUIRED_VARS.filter((name) => {
    const v = env[name];
    return v === undefined || v.trim() === '';
  });
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const missing = findMissingConfigVars(
  import.meta.env as Record<string, string | undefined>,
);
if (missing.length > 0) {
  console.error(
    `[firebase] Faltan variables de entorno requeridas: ${missing.join(', ')}`,
  );
}

// Idempotencia: reutiliza la app existente si ya fue inicializada (Req 1.2, 1.4).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
