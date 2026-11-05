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

// Official Firebase Project Credentials for project "kalor3-ff4af"
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCErNW-portvbj7qSL-cCK1DaWNpW2yRFg",
  authDomain: "kalor3-ff4af.firebaseapp.com",
  databaseURL: "https://kalor3-ff4af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kalor3-ff4af",
  storageBucket: "kalor3-ff4af.firebasestorage.app",
  messagingSenderId: "137693547137",
  appId: "1:137693547137:web:4f17c9c5c8e7a47ad2db80",
  measurementId: "G-HQGHW6NYJT"
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
 * Also auto-detects ?db= URL parameter if shared by Teacher
 */
export function getFirebaseConfig() {
  // Check if a database URL was passed in the URL (e.g. from teacher's share link)
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const dbParam = urlParams.get('db');
      if (dbParam) {
        const decoded = decodeURIComponent(dbParam).trim();
        if (decoded.startsWith('https://')) {
          const cfg = { ...DEFAULT_FIREBASE_CONFIG, databaseURL: decoded };
          localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(cfg));
          return cfg;
        }
      }
    }
  } catch (e) {
    console.warn('[FirebaseConfig] URL param parsing error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure stored config matches the active projectId "kalor3-ff4af"
      if (parsed && parsed.projectId === DEFAULT_FIREBASE_CONFIG.projectId && (parsed.apiKey || parsed.databaseURL)) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      } else {
        // Discard obsolete project cache
        localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
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
