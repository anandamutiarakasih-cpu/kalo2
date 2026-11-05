/**
 * THERMO CHAMPIONS: HEAT EDITION — FIREBASE CONFIG & INITIALIZER
 * Vanilla JavaScript (ES Modules) via official Google Firebase Modular SDK
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Storage keys for persistent settings
export const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'thermo_firebase_config',
  ACTIVE_SESSION: 'thermo_active_session',
  ACTIVE_GROUP: 'thermo_active_group',
  DEVICE_TOKEN: 'thermo_device_token',
  ADMIN_SESSION_ID: 'thermo_admin_session_id',
  MUTED: 'thermo_muted'
};

// Default Firebase Configuration (can be updated dynamically in Admin Settings or localStorage)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDummyKeyReplaceInSettings12345678",
  authDomain: "thermo-champions.firebaseapp.com",
  databaseURL: "https://thermo-champions-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thermo-champions",
  storageBucket: "thermo-champions.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

/**
 * Get or generate persistent unique device token
 */
export function getDeviceToken() {
  let token = localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
  if (!token) {
    token = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
  }
  return token;
}

/**
 * Get current Firebase Configuration
 */
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.apiKey || parsed.databaseURL)) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn('[FirebaseConfig] Failed to parse stored config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Save updated Firebase config to localStorage
 */
export function setFirebaseConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(cfg));
  return true;
}

/**
 * Initialize or get Firebase App instance
 */
let appInstance = null;

export function getFirebaseApp() {
  if (appInstance) return appInstance;

  const apps = getApps();
  if (apps.length > 0) {
    appInstance = getApp();
    return appInstance;
  }

  const config = getFirebaseConfig();
  try {
    appInstance = initializeApp(config);
    console.log('[ThermoChampions] Firebase App initialized for project:', config.projectId);
    return appInstance;
  } catch (err) {
    console.error('[ThermoChampions] Error initializing Firebase App:', err);
    return null;
  }
}
