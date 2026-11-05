/**
 * THERMO CHAMPIONS: HEAT EDITION — REALTIME DATABASE MULTIPLAYER SERVICE
 * Handles 8-group atomic slots, synchronized start, server-time sync, and live leaderboard.
 */

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  off,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getFirebaseApp, getDeviceToken, getFirebaseConfig } from "./config.js";
import { ensureAuthenticated } from "./auth.js";
import { getPredicate } from "../../data/questions.js";

let dbInstance = null;
let serverTimeOffset = 0;
let timeOffsetListenerActive = false;

export function getRTDB() {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  const cfg = getFirebaseConfig();
  try {
    dbInstance = getDatabase(app, cfg.databaseURL);
    initServerTimeSync();
    return dbInstance;
  } catch (e) {
    console.warn('[RTDB] Error getting database instance:', e);
    return null;
  }
}

/**
 * Reset database instance (useful when user updates the databaseURL in settings)
 */
export function resetRTDBInstance() {
  dbInstance = null;
  timeOffsetListenerActive = false;
  return getRTDB();
}

/**
 * Listen to database connection state (.info/connected)
 */
export function listenToConnection(callback) {
  const db = getRTDB();
  if (!db) {
    if (callback) callback(false, new Error('Database Realtime tidak tersedia.'));
    return () => {};
  }

  const connectedRef = ref(db, ".info/connected");
  const listener = onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    if (callback) callback(isConnected);
  }, (err) => {
    console.warn('[RTDB] Connection listener error:', err);
    if (callback) callback(false, err);
  });

  return () => off(connectedRef, 'value', listener);
}

/**
 * Synchronize device clock with Firebase server clock
 */
export function initServerTimeSync() {
  if (timeOffsetListenerActive) return;
  const db = dbInstance || getRTDB();
  if (!db) return;

  try {
    const offsetRef = ref(db, ".info/serverTimeOffset");
    onValue(offsetRef, (snap) => {
      serverTimeOffset = snap.val() || 0;
      timeOffsetListenerActive = true;
    });
  } catch (e) {
    console.warn('[RTDB] Time offset listener error:', e);
  }
}

/**
 * Return current millisecond time synchronized with server
 */
export function getSyncedServerNow() {
  return Date.now() + serverTimeOffset;
}

/**
 * Create a new tournament session (Admin Game Master)
 */
export async function createSession(title = 'Turnamen Kalor IPA', customCode = '') {
  await ensureAuthenticated();
  const db = getRTDB();
  if (!db) throw new Error('Database Realtime tidak tersedia. Pastikan Realtime Database sudah dibuat di Firebase Console.');

  const code = (customCode && customCode.trim())
    ? customCode.trim().toUpperCase()
    : 'TC-' + Math.floor(1000 + Math.random() * 9000);

  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const sessionData = {
    id: sessionId,
    sessionCode: code,
    title: (title || 'Turnamen Kalor IPA').trim(),
    status: 'waiting', // waiting | countdown | started | paused | ended
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
    totalDurationSeconds: 0
  };

  const updates = {};
  updates[`/sessions/${sessionId}`] = sessionData;
  updates[`/sessionCodes/${code}`] = sessionId;

  await update(ref(db), updates);

  return {
    success: true,
    sessionId,
    sessionCode: code,
    session: sessionData
  };
}

/**
 * Lookup session by its code (e.g. TC-7929)
 */
export async function getSessionByCode(rawCode) {
  const db = getRTDB();
  if (!db) {
    throw new Error('Database Realtime belum siap. Periksa konfigurasi Firebase.');
  }

  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return null;

  try {
    const codeSnap = await get(ref(db, `/sessionCodes/${code}`));
    if (!codeSnap.exists()) return null;

    const sessionId = codeSnap.val();
    const sessionSnap = await get(ref(db, `/sessions/${sessionId}`));
    if (!sessionSnap.exists()) return null;

    return {
      sessionId,
      session: sessionSnap.val()
    };
  } catch (err) {
    console.error('[RTDB] Error looking up session code:', err);
    throw err;
  }
}

/**
 * Claim an 8-group slot atomically (Kelompok 1 - 8)
 * Concurrency guard: prevents 2 devices from claiming the same group slot.
 */
export async function claimGroupSlot(sessionId, groupNumber, groupName, members, customDeviceToken = null) {
  await ensureAuthenticated();
  const db = getRTDB();
  if (!db) throw new Error('Database Realtime tidak tersedia.');

  const num = Number(groupNumber);
  if (isNaN(num) || num < 1 || num > 8) {
    throw new Error('Nomor kelompok harus antara 1 sampai 8.');
  }

  const deviceToken = customDeviceToken || getDeviceToken();
  const groupKey = `group${num}`;
  const groupRef = ref(db, `/sessionGroups/${sessionId}/${groupKey}`);

  const tx = await runTransaction(groupRef, (currentData) => {
    if (currentData !== null) {
      // Slot already occupied. Allow rejoin ONLY if same deviceToken
      if (currentData.deviceToken === deviceToken) {
        currentData.isOnline = true;
        currentData.lastActive = Date.now();
        return currentData;
      }
      // Taken by another device! Abort transaction.
      return undefined;
    }

    // Slot is free: Claim atomically
    return {
      groupNumber: num,
      groupName: (groupName || `Kelompok ${num}`).trim(),
      members: Array.isArray(members) ? members : [],
      deviceToken: deviceToken,
      status: 'ready', // ready | in_game | finished
      isOnline: true,
      lastActive: Date.now(),
      scores: { quiz: 0, memory: 0, calc: 0, total: 0 },
      completedModes: { quiz: false, memory: false, calc: false },
      totalDurationSeconds: 0
    };
  });

  if (!tx.committed) {
    return {
      success: false,
      message: `Kelompok ${num} sudah dipilih oleh perangkat lain! Silakan pilih nomor kelompok yang masih tersedia.`
    };
  }

  const registeredGroup = tx.snapshot.val();

  // Initialize Leaderboard entry for this group
  const lbRef = ref(db, `/leaderboards/${sessionId}/${groupKey}`);
  await set(lbRef, {
    groupNumber: num,
    groupName: registeredGroup.groupName,
    membersCount: (registeredGroup.members || []).length,
    skorQuiz: 0,
    skorMemory: 0,
    skorNumberChains: 0,
    totalSkor: 0,
    totalDurationSeconds: 0,
    status: 'ready',
    predicate: 'THERMAL ROOKIE',
    lastUpdate: Date.now()
  });

  return {
    success: true,
    group: registeredGroup
  };
}

/**
 * Release group slot if student backs out or leaves
 */
export async function releaseGroupSlot(sessionId, groupNumber, deviceToken) {
  const db = getRTDB();
  if (!db || !sessionId || !groupNumber) return false;

  const groupKey = `group${groupNumber}`;
  const groupRef = ref(db, `/sessionGroups/${sessionId}/${groupKey}`);

  try {
    const snap = await get(groupRef);
    if (snap.exists() && snap.val().deviceToken === deviceToken) {
      await set(groupRef, null);
      await set(ref(db, `/leaderboards/${sessionId}/${groupKey}`), null);
      return true;
    }
  } catch (e) {
    console.warn('[RTDB] releaseGroupSlot error:', e);
  }
  return false;
}

/**
 * Subscribe to Session status changes (Waiting, Started, Paused, Ended)
 */
export function listenToSession(sessionId, callback) {
  const db = getRTDB();
  if (!db || !sessionId) return () => {};

  const sRef = ref(db, `/sessions/${sessionId}`);
  const listener = onValue(sRef, (snap) => {
    if (callback) callback(snap.exists() ? snap.val() : null);
  });

  return () => off(sRef, 'value', listener);
}

/**
 * Subscribe to 8-group slots in the lobby
 */
export function listenToLobbyGroups(sessionId, callback) {
  const db = getRTDB();
  if (!db || !sessionId) return () => {};

  const groupsRef = ref(db, `/sessionGroups/${sessionId}`);
  const listener = onValue(groupsRef, (snap) => {
    const val = snap.val() || {};
    if (callback) callback(val);
  });

  return () => off(groupsRef, 'value', listener);
}

/**
 * Subscribe to Real-time Leaderboard table
 */
export function listenToLeaderboard(sessionId, callback) {
  const db = getRTDB();
  if (!db || !sessionId) return () => {};

  const lbRef = ref(db, `/leaderboards/${sessionId}`);
  const listener = onValue(lbRef, (snap) => {
    const val = snap.val() || {};
    const list = Object.keys(val).map(k => val[k]);
    // Sort ranking:
    // 1. Total score DESC
    // 2. Duration ASC (faster is better)
    list.sort((a, b) => {
      if ((b.totalSkor || 0) !== (a.totalSkor || 0)) {
        return (b.totalSkor || 0) - (a.totalSkor || 0);
      }
      return (a.totalDurationSeconds || 0) - (b.totalDurationSeconds || 0);
    });
    if (callback) callback(list);
  });

  return () => off(lbRef, 'value', listener);
}

/**
 * Admin: Synchronized tournament start for all groups
 */
export async function startTournamentTogether(sessionId) {
  await ensureAuthenticated();
  const db = getRTDB();
  if (!db) return false;

  const updates = {};
  updates[`/sessions/${sessionId}/status`] = 'started';
  updates[`/sessions/${sessionId}/startedAt`] = Date.now();

  // Update all registered group statuses to 'in_game'
  const groupsSnap = await get(ref(db, `/sessionGroups/${sessionId}`));
  if (groupsSnap.exists()) {
    const groups = groupsSnap.val();
    for (const key in groups) {
      if (groups[key]) {
        updates[`/sessionGroups/${sessionId}/${key}/status`] = 'in_game';
        updates[`/leaderboards/${sessionId}/${key}/status`] = 'in_game';
      }
    }
  }

  await update(ref(db), updates);
  return true;
}

/**
 * Admin: Pause tournament
 */
export async function pauseTournament(sessionId) {
  const db = getRTDB();
  if (!db) return;
  await update(ref(db, `/sessions/${sessionId}`), {
    status: 'paused',
    pausedAt: Date.now()
  });
}

/**
 * Admin: Resume tournament
 */
export async function resumeTournament(sessionId) {
  const db = getRTDB();
  if (!db) return;
  await update(ref(db, `/sessions/${sessionId}`), {
    status: 'started'
  });
}

/**
 * Admin: End tournament
 */
export async function endTournament(sessionId) {
  const db = getRTDB();
  if (!db) return;
  await update(ref(db, `/sessions/${sessionId}`), {
    status: 'ended',
    endedAt: Date.now()
  });
}

/**
 * Admin: Reset session data
 */
export async function resetSessionData(sessionId) {
  const db = getRTDB();
  if (!db || !sessionId) return;

  const updates = {};
  updates[`/sessions/${sessionId}/status`] = 'waiting';
  updates[`/sessions/${sessionId}/startedAt`] = null;
  updates[`/sessions/${sessionId}/endedAt`] = null;

  const groupsSnap = await get(ref(db, `/sessionGroups/${sessionId}`));
  if (groupsSnap.exists()) {
    const groups = groupsSnap.val();
    for (const key in groups) {
      if (groups[key]) {
        updates[`/sessionGroups/${sessionId}/${key}/scores`] = { quiz: 0, memory: 0, calc: 0, total: 0 };
        updates[`/sessionGroups/${sessionId}/${key}/completedModes`] = { quiz: false, memory: false, calc: false };
        updates[`/sessionGroups/${sessionId}/${key}/status`] = 'ready';
        updates[`/sessionGroups/${sessionId}/${key}/totalDurationSeconds`] = 0;

        updates[`/leaderboards/${sessionId}/${key}/skorQuiz`] = 0;
        updates[`/leaderboards/${sessionId}/${key}/skorMemory`] = 0;
        updates[`/leaderboards/${sessionId}/${key}/skorNumberChains`] = 0;
        updates[`/leaderboards/${sessionId}/${key}/totalSkor`] = 0;
        updates[`/leaderboards/${sessionId}/${key}/totalDurationSeconds`] = 0;
        updates[`/leaderboards/${sessionId}/${key}/status`] = 'ready';
        updates[`/leaderboards/${sessionId}/${key}/predicate`] = 'THERMAL ROOKIE';
      }
    }
  }

  updates[`/submissions/${sessionId}`] = null;
  await update(ref(db), updates);
}

/**
 * Submit answer with direct Realtime Database atomic transaction
 * Used as primary or client fallback ensuring zero double-scoring and strict validation
 */
export async function submitAnswerDirect(sessionId, groupNumber, deviceToken, mode, itemId, answer, isCorrect, scoreWeight, timeSpentSeconds = 0) {
  await ensureAuthenticated();
  const db = getRTDB();
  if (!db) throw new Error('Database Realtime tidak tersedia.');

  const groupKey = `group${groupNumber}`;
  const subKey = `${mode}_${itemId}`;
  const subRef = ref(db, `/submissions/${sessionId}/${groupKey}/${subKey}`);

  // Check if already submitted
  const subSnap = await get(subRef);
  if (subSnap.exists()) {
    return {
      duplicate: true,
      awardedScore: subSnap.val().awardedScore || 0,
      isCorrect: subSnap.val().isCorrect || false
    };
  }

  const awardedScore = isCorrect ? scoreWeight : 0;

  // Record submission
  await set(subRef, {
    mode,
    itemId,
    answer,
    isCorrect,
    awardedScore,
    deviceToken,
    submittedAt: Date.now()
  });

  // Update group total score atomically
  const groupRef = ref(db, `/sessionGroups/${sessionId}/${groupKey}`);
  let finalGroupData = null;

  await runTransaction(groupRef, (curr) => {
    if (!curr) return curr;
    if (!curr.scores) curr.scores = { quiz: 0, memory: 0, calc: 0, total: 0 };

    if (mode === 'quiz') curr.scores.quiz = Math.min(35, Math.round(((curr.scores.quiz || 0) + awardedScore) * 10) / 10);
    if (mode === 'memory') curr.scores.memory = Math.min(30, Math.round(((curr.scores.memory || 0) + awardedScore) * 10) / 10);
    if (mode === 'calc') curr.scores.calc = Math.min(35, Math.round(((curr.scores.calc || 0) + awardedScore) * 10) / 10);

    curr.scores.total = Math.min(100, Math.round((curr.scores.quiz + curr.scores.memory + curr.scores.calc) * 10) / 10);

    if (timeSpentSeconds > 0) {
      curr.totalDurationSeconds = (curr.totalDurationSeconds || 0) + Number(timeSpentSeconds);
    }
    curr.lastActive = Date.now();
    finalGroupData = curr;
    return curr;
  });

  // Update leaderboard summary
  if (finalGroupData) {
    const pred = getPredicate(finalGroupData.scores.total);
    await update(ref(db, `/leaderboards/${sessionId}/${groupKey}`), {
      skorQuiz: finalGroupData.scores.quiz,
      skorMemory: finalGroupData.scores.memory,
      skorNumberChains: finalGroupData.scores.calc,
      totalSkor: finalGroupData.scores.total,
      totalDurationSeconds: finalGroupData.totalDurationSeconds || 0,
      predicate: pred.title,
      lastUpdate: Date.now()
    });
  }

  return {
    duplicate: false,
    isCorrect,
    awardedScore,
    scores: finalGroupData ? finalGroupData.scores : null
  };
}

/**
 * Mark a mode as completed for a group
 */
export async function markModeCompleted(sessionId, groupNumber, modeKey) {
  const db = getRTDB();
  if (!db || !sessionId || !groupNumber) return;

  const groupKey = `group${groupNumber}`;
  const updates = {};
  updates[`/sessionGroups/${sessionId}/${groupKey}/completedModes/${modeKey}`] = true;
  await update(ref(db), updates);
}

/**
 * Finish the game for a group
 */
export async function finishGroupGame(sessionId, groupNumber) {
  const db = getRTDB();
  if (!db || !sessionId || !groupNumber) return;

  const groupKey = `group${groupNumber}`;
  const updates = {};
  updates[`/sessionGroups/${sessionId}/${groupKey}/status`] = 'finished';
  updates[`/leaderboards/${sessionId}/${groupKey}/status`] = 'finished';
  await update(ref(db), updates);
}
