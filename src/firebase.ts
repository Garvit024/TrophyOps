import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { DBState } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCsOzm7kRGC_XOydqmLg2VexvaGxgSuklI",
  authDomain: "pharmaintelligence-503e4.firebaseapp.com",
  projectId: "pharmaintelligence-503e4",
  storageBucket: "pharmaintelligence-503e4.firebasestorage.app",
  messagingSenderId: "451062106715",
  appId: "1:451062106715:web:390fc9bdd93001ec4e4d7e"
};

let db: any = null;
let isConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    isConfigured = true;
  } else {
    console.warn("Firebase configuration is missing. Falling back to Local Storage.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

const DOCUMENT_PATH = 'system_data/main_state';

/**
 * Fetches the database state from Firestore.
 * Returns null if not configured or document doesn't exist.
 */
export async function loadDbFromFirebase(): Promise<DBState | null> {
  if (!isConfigured || !db) return null;

  try {
    const docRef = doc(db, DOCUMENT_PATH);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DBState;
    } else {
      console.log("No data found in Firestore.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching from Firebase:", error);
    return null;
  }
}

/**
 * Saves the entire DB state to Firestore.
 */
export async function saveDbToFirebase(state: DBState): Promise<boolean> {
  if (!isConfigured || !db) return false;

  try {
    const docRef = doc(db, DOCUMENT_PATH);
    await setDoc(docRef, state);
    return true;
  } catch (error) {
    console.error("Error writing to Firebase:", error);
    return false;
  }
}

export const isFirebaseActive = () => isConfigured;
