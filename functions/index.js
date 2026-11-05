/**
 * THERMO CHAMPIONS: HEAT EDITION — BACKEND CLOUD FUNCTIONS
 * Firebase Admin SDK + Secure Server-Side Scoring & Anti-Cheat Validation
 * Kunci jawaban dan verifikasi skor resmi materi Kalor disimpan aman di server.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

// ============================================================================
// SERVER ANSWER KEYS & SOLUTIONS (KALOR / HEAT EDITION)
// ============================================================================

const SERVER_QUIZ_KEYS = {
  1: { correct: "B", weight: 3.5, exp: "Kalor adalah energi panas yang berpindah dari benda bersuhu lebih tinggi ke suhu lebih rendah." },
  2: { correct: "C", weight: 3.5, exp: "1 kalori setara dengan 4,2 Joule (atau 1 Joule ≈ 0,24 kalori)." },
  3: { correct: "A", weight: 3.5, exp: "Rumus utama kalor perubahan suhu: Q = m · c · ΔT." },
  4: { correct: "C", weight: 3.5, exp: "Air membutuhkan 4.200 Joule untuk menaikkan suhu 1 kg air sebesar 1°C sehingga lebih lambat panas dibanding pasir." },
  5: { correct: "B", weight: 3.5, exp: "Kalor laten diserap untuk memutus ikatan molekul (perubahan wujud) sehingga suhu tetap konstan." },
  6: { correct: "B", weight: 3.5, exp: "Azas Black: kalor yang dilepas benda panas sama dengan kalor yang diserap benda dingin (Q_lepas = Q_terima)." },
  7: { correct: "A", weight: 3.5, exp: "Konduksi adalah hantaran kalor melalui zat padat tanpa disertai perpindahan partikel zat." },
  8: { correct: "A", weight: 3.5, exp: "Konveksi adalah aliran fluida disertai partikel. Udara darat naik karena cepat panas, digantikan udara laut." },
  9: { correct: "C", weight: 3.5, exp: "Radiasi adalah pancaran gelombang elektromagnetik tanpa memerlukan medium (dapat lewat ruang hampa)." },
  10: { correct: "A", weight: 3.5, exp: "Lapisan kaca mengilap pada termos memantulkan radiasi panas kembali ke dalam termos." }
};

const SERVER_MEMORY_KEYS = {
  1: { correct: "Energi Panas Berpindah", weight: 3.0, exp: "Kalor adalah energi panas yang berpindah dari suhu tinggi ke rendah." },
  2: { correct: "Q = m · c · ΔT", weight: 3.0, exp: "Rumus perubahan suhu zat adalah Q = m · c · ΔT." },
  3: { correct: "4.200 J/kg°C", weight: 3.0, exp: "Kalor jenis air murni adalah 4.200 J/kg°C." },
  4: { correct: "Q = m · L", weight: 3.0, exp: "Rumus kalor lebur zat adalah Q = m · L." },
  5: { correct: "336.000 J/kg", weight: 3.0, exp: "Kalor lebur es adalah 336.000 J/kg." },
  6: { correct: "Q = m · U", weight: 3.0, exp: "Rumus kalor penguapan zat adalah Q = m · U." },
  7: { correct: "Q_lepas = Q_terima", weight: 3.0, exp: "Hukum Azas Black menyatakan Q_lepas = Q_terima." },
  8: { correct: "Konduksi", weight: 3.0, exp: "Konduksi adalah hantaran zat padat tanpa perpindahan partikel." },
  9: { correct: "Konveksi", weight: 3.0, exp: "Konveksi adalah perpindahan kalor melalui aliran partikel fluida." },
  10: { correct: "Radiasi", weight: 3.0, exp: "Radiasi adalah pancaran gelombang elektromagnetik tanpa medium." }
};

const SERVER_CALC_KEYS = {
  1: { target: 420000, tolerance: 1.0, weight: 7.0, exp: "Q = 2 kg × 4.200 J/kg°C × 50°C = 420.000 Joule" },
  2: { target: 168000, tolerance: 1.0, weight: 7.0, exp: "Q = 0,5 kg × 336.000 J/kg = 168.000 Joule" },
  3: { target: 30, tolerance: 0.5, weight: 7.0, exp: "ΔT = 54.000 / (2 × 900) = 30°C" },
  4: { target: 380, tolerance: 0.5, weight: 7.0, exp: "C = 19.000 J / 50°C = 380 J/°C" },
  5: {
    multiSteps: true,
    steps: {
      s5_a: { target: 336000, tolerance: 1.0, weight: 3.5, exp: "Q1 = 1 kg × 336.000 J/kg = 336.000 Joule" },
      s5_b: { target: 420000, tolerance: 1.0, weight: 3.5, exp: "Q2 = 1 kg × 4.200 J/kg°C × 100°C = 420.000 Joule" }
    }
  }
};

function calculatePredicate(score) {
  const s = Math.round(score * 10) / 10;
  if (s >= 86) return { title: "THERMO CHAMPION", badge: "🏆" };
  if (s >= 76) return { title: "HEAT EXPERT", badge: "🥇" };
  if (s >= 66) return { title: "SCIENCE CHALLENGER", badge: "🥈" };
  if (s >= 56) return { title: "HEAT EXPLORER", badge: "🥉" };
  return { title: "THERMAL ROOKIE", badge: "🌱" };
}

// ============================================================================
// CALLABLE HTTPS CLOUD FUNCTIONS
// ============================================================================

/**
 * 1. createSession: Admin Guru membuat ruang turnamen
 */
exports.createSession = functions.https.onCall(async (data, context) => {
  const title = (data.title || "Turnamen Kalor IPA SMP").trim();
  const rawCode = data.customCode && data.customCode.trim() 
    ? data.customCode.trim().toUpperCase() 
    : "TC-" + Math.floor(1000 + Math.random() * 9000);

  const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const sessionData = {
    id: sessionId,
    sessionCode: rawCode,
    title: title,
    status: "waiting", // waiting | started | paused | ended
    createdAt: admin.database.ServerValue.TIMESTAMP,
    startedAt: null,
    endedAt: null,
    totalDurationSeconds: 0,
    createdBy: context.auth ? context.auth.uid : "admin"
  };

  const updates = {};
  updates[`/sessions/${sessionId}`] = sessionData;
  updates[`/sessionCodes/${rawCode}`] = sessionId;

  await db.ref().update(updates);

  return {
    success: true,
    sessionId: sessionId,
    sessionCode: rawCode,
    session: sessionData
  };
});

/**
 * 2. joinGroup: Siswa mendaftarkan nomor kelompok (1 - 8)
 */
exports.joinGroup = functions.https.onCall(async (data, context) => {
  const { sessionId, groupNumber, groupName, members, deviceToken } = data;

  const num = Number(groupNumber);
  if (isNaN(num) || num < 1 || num > 8) {
    return { success: false, message: "Nomor kelompok harus antara 1 sampai 8." };
  }

  if (!sessionId || !deviceToken) {
    return { success: false, message: "Parameter sesi dan perangkat tidak valid." };
  }

  const groupKey = `group${num}`;
  const groupRef = db.ref(`/sessionGroups/${sessionId}/${groupKey}`);

  const tx = await groupRef.transaction((curr) => {
    if (curr !== null) {
      if (curr.deviceToken === deviceToken) {
        curr.isOnline = true;
        curr.lastActive = Date.now();
        return curr;
      }
      return undefined; // Slot occupied by another device
    }

    return {
      groupNumber: num,
      groupName: (groupName || `Kelompok ${num}`).trim(),
      members: Array.isArray(members) ? members : [],
      deviceToken: deviceToken,
      status: "ready",
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
      message: `Kelompok ${num} telah diambil oleh perangkat lain!`
    };
  }

  const registeredGroup = tx.snapshot.val();

  // Initialize Leaderboard Entry
  await db.ref(`/leaderboards/${sessionId}/${groupKey}`).set({
    groupNumber: num,
    groupName: registeredGroup.groupName,
    membersCount: (registeredGroup.members || []).length,
    skorQuiz: 0,
    skorMemory: 0,
    skorNumberChains: 0,
    totalSkor: 0,
    totalDurationSeconds: 0,
    status: "ready",
    predicate: "THERMAL ROOKIE",
    lastUpdate: Date.now()
  });

  return {
    success: true,
    group: registeredGroup
  };
});

/**
 * 3. startSession: Guru memulai turnamen secara serentak
 */
exports.startSession = functions.https.onCall(async (data, context) => {
  const { sessionId } = data;
  if (!sessionId) return { success: false };

  const updates = {};
  updates[`/sessions/${sessionId}/status`] = "started";
  updates[`/sessions/${sessionId}/startedAt`] = Date.now();

  const groupsSnap = await db.ref(`/sessionGroups/${sessionId}`).once("value");
  if (groupsSnap.exists()) {
    const groups = groupsSnap.val();
    for (const key in groups) {
      if (groups[key]) {
        updates[`/sessionGroups/${sessionId}/${key}/status`] = "in_game";
        updates[`/leaderboards/${sessionId}/${key}/status`] = "in_game";
      }
    }
  }

  await db.ref().update(updates);
  return { success: true, status: "started" };
});

/**
 * 4. submitAnswer: Validasi jawaban server-side anti-cheat
 */
exports.submitAnswer = functions.https.onCall(async (data, context) => {
  const { sessionId, groupNumber, deviceToken, mode, itemId, answer, timeSpentSeconds, stepId } = data;

  if (!sessionId || !groupNumber || !mode || !itemId) {
    return { success: false, message: "Data pengiriman tidak lengkap." };
  }

  const groupKey = `group${groupNumber}`;
  const subKey = stepId ? `${mode}_${itemId}_${stepId}` : `${mode}_${itemId}`;
  const subRef = db.ref(`/submissions/${sessionId}/${groupKey}/${subKey}`);

  // Prevent double submissions
  const subSnap = await subRef.once("value");
  if (subSnap.exists()) {
    return {
      success: true,
      duplicate: true,
      awardedScore: subSnap.val().awardedScore || 0,
      isCorrect: subSnap.val().isCorrect || false
    };
  }

  // Server-side verification
  let isCorrect = false;
  let scoreWeight = 0;
  let explanation = "";

  if (mode === "quiz") {
    const qKey = SERVER_QUIZ_KEYS[itemId];
    if (qKey) {
      scoreWeight = qKey.weight;
      isCorrect = String(answer).trim().toUpperCase() === qKey.correct;
      explanation = qKey.exp;
    }
  } else if (mode === "memory") {
    const mKey = SERVER_MEMORY_KEYS[itemId];
    if (mKey) {
      scoreWeight = mKey.weight;
      isCorrect = String(answer).trim().toLowerCase() === mKey.correct.toLowerCase();
      explanation = mKey.exp;
    }
  } else if (mode === "calc") {
    const cKey = SERVER_CALC_KEYS[itemId];
    if (cKey) {
      if (cKey.multiSteps && stepId && cKey.steps[stepId]) {
        const stepCfg = cKey.steps[stepId];
        scoreWeight = stepCfg.weight;
        const diff = Math.abs(parseFloat(answer) - stepCfg.target);
        isCorrect = diff <= stepCfg.tolerance;
        explanation = stepCfg.exp;
      } else if (!cKey.multiSteps) {
        scoreWeight = cKey.weight;
        const diff = Math.abs(parseFloat(answer) - cKey.target);
        isCorrect = diff <= cKey.tolerance;
        explanation = cKey.exp;
      }
    }
  }

  const awardedScore = isCorrect ? scoreWeight : 0;

  // Record submission
  await subRef.set({
    mode,
    itemId,
    stepId: stepId || null,
    answer,
    isCorrect,
    awardedScore,
    deviceToken: deviceToken || null,
    submittedAt: Date.now()
  });

  // Update group score atomically
  const groupRef = db.ref(`/sessionGroups/${sessionId}/${groupKey}`);
  let finalGroup = null;

  await groupRef.transaction((curr) => {
    if (!curr) return curr;
    if (!curr.scores) curr.scores = { quiz: 0, memory: 0, calc: 0, total: 0 };

    if (mode === "quiz") curr.scores.quiz = Math.min(35, Math.round(((curr.scores.quiz || 0) + awardedScore) * 10) / 10);
    if (mode === "memory") curr.scores.memory = Math.min(30, Math.round(((curr.scores.memory || 0) + awardedScore) * 10) / 10);
    if (mode === "calc") curr.scores.calc = Math.min(35, Math.round(((curr.scores.calc || 0) + awardedScore) * 10) / 10);

    curr.scores.total = Math.min(100, Math.round((curr.scores.quiz + curr.scores.memory + curr.scores.calc) * 10) / 10);

    if (timeSpentSeconds && Number(timeSpentSeconds) > 0) {
      curr.totalDurationSeconds = (curr.totalDurationSeconds || 0) + Number(timeSpentSeconds);
    }
    curr.lastActive = Date.now();
    finalGroup = curr;
    return curr;
  });

  // Update Leaderboard
  if (finalGroup) {
    const pred = calculatePredicate(finalGroup.scores.total);
    await db.ref(`/leaderboards/${sessionId}/${groupKey}`).update({
      skorQuiz: finalGroup.scores.quiz,
      skorMemory: finalGroup.scores.memory,
      skorNumberChains: finalGroup.scores.calc,
      totalSkor: finalGroup.scores.total,
      totalDurationSeconds: finalGroup.totalDurationSeconds || 0,
      predicate: pred.title,
      lastUpdate: Date.now()
    });
  }

  return {
    success: true,
    duplicate: false,
    isCorrect,
    awardedScore,
    explanation,
    scores: finalGroup ? finalGroup.scores : null
  };
});
