import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDR91D_1_ijJztpUD2qy-ovqvDsGZ83Zjg",
  authDomain: "brusaexchangecrypto-a82b3.firebaseapp.com",
  databaseURL: "https://brusaexchangecrypto-a82b3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brusaexchangecrypto-a82b3",
  storageBucket: "brusaexchangecrypto-a82b3.firebasestorage.app",
  messagingSenderId: "192578822040",
  appId: "1:192578822040:web:4a584da0cbaa85d6dd55ed",
  measurementId: "G-PFCBG9HGJS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Export common Firestore functions wrapped with error handling if needed, 
// or just export them and wrap them in hooks.
