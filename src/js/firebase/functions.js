/**
 * THERMO CHAMPIONS: HEAT EDITION — FIREBASE CLOUD FUNCTIONS CALLER & CLIENT FALLBACK
 * Provides secure server-side scoring with graceful local fallback.
 */

import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getFirebaseApp } from "./config.js";
import * as dbService from "./database.js";

let functionsInstance = null;

export function getFirebaseFunctions() {
  if (functionsInstance) return functionsInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    functionsInstance = getFunctions(app, 'us-central1');
    return functionsInstance;
  } catch (e) {
    console.warn('[Functions] Could not initialize Firebase Functions:', e);
    return null;
  }
}

/**
 * Call createSession via Cloud Function or fallback to Database
 */
export async function callCreateSession(title, customCode = '') {
  const fns = getFirebaseFunctions();
  if (fns) {
    try {
      const callable = httpsCallable(fns, 'createSession');
      const res = await callable({ title, customCode });
      if (res && res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[Functions] Cloud Function createSession failed, falling back to Direct RTDB:', err.message);
    }
  }
  return await dbService.createSession(title, customCode);
}

/**
 * Call joinGroup via Cloud Function or fallback to Database
 */
export async function callJoinGroup(sessionId, groupNumber, groupName, members, deviceToken) {
  const fns = getFirebaseFunctions();
  if (fns) {
    try {
      const callable = httpsCallable(fns, 'joinGroup');
      const res = await callable({ sessionId, groupNumber, groupName, members, deviceToken });
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[Functions] Cloud Function joinGroup failed, falling back to Direct RTDB:', err.message);
    }
  }
  return await dbService.claimGroupSlot(sessionId, groupNumber, groupName, members, deviceToken);
}

/**
 * Call startSession via Cloud Function or fallback to Database
 */
export async function callStartSession(sessionId) {
  const fns = getFirebaseFunctions();
  if (fns) {
    try {
      const callable = httpsCallable(fns, 'startSession');
      const res = await callable({ sessionId });
      if (res && res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[Functions] Cloud Function startSession failed, falling back to Direct RTDB:', err.message);
    }
  }
  const ok = await dbService.startTournamentTogether(sessionId);
  return { success: ok, status: 'started' };
}

/**
 * Call submitAnswer via Cloud Function or fallback to Database
 */
export async function callSubmitAnswer(sessionId, groupNumber, deviceToken, mode, itemId, answer, isCorrectFallback, scoreWeight, timeSpentSeconds, stepId = null) {
  const fns = getFirebaseFunctions();
  if (fns) {
    try {
      const callable = httpsCallable(fns, 'submitAnswer');
      const payload = { sessionId, groupNumber, deviceToken, mode, itemId, answer, timeSpentSeconds };
      if (stepId) payload.stepId = stepId;
      const res = await callable(payload);
      if (res && res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[Functions] Cloud Function submitAnswer failed, falling back to Direct RTDB:', err.message);
    }
  }

  // Fallback to direct client RTDB atomic transaction
  return await dbService.submitAnswerDirect(
    sessionId,
    groupNumber,
    deviceToken,
    mode,
    stepId ? `${itemId}_${stepId}` : itemId,
    answer,
    isCorrectFallback,
    scoreWeight,
    timeSpentSeconds
  );
}
