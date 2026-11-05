/**
 * THERMO CHAMPIONS: HEAT EDITION — FIREBASE AUTHENTICATION
 * Pure Vanilla JavaScript (ES Modules)
 */

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirebaseApp } from "./config.js";

let authInstance = null;
let currentUser = null;

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (e) {
    console.warn('[FirebaseAuth] Error getting auth instance:', e);
    return null;
  }
}

/**
 * Sign in anonymously for student group device or admin
 */
export async function ensureAuthenticated() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth tidak dapat diinisialisasi. Periksa koneksi internet Anda.');
  }

  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }

  try {
    const cred = await signInAnonymously(auth);
    currentUser = cred.user;
    console.log('[FirebaseAuth] Signed in anonymously as uid:', currentUser.uid);
    return currentUser;
  } catch (err) {
    console.warn('[FirebaseAuth] Anonymous sign-in warning:', err.code, err.message);
    if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
      const msg = 'Layanan "Anonymous Sign-in" belum diaktifkan di Firebase Console! Buka Firebase Console -> Authentication -> Sign-in method -> Aktifkan Anonymous.';
      console.error(msg);
      throw new Error(msg);
    }
    throw err;
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuth(callback) {
  const auth = getFirebaseAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (callback) callback(user);
  });
}

export function getCurrentUser() {
  const auth = getFirebaseAuth();
  return auth ? auth.currentUser : currentUser;
}
