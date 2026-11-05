/**
 * THERMO CHAMPIONS: HEAT EDITION — MAIN CLIENT APPLICATION CONTROLLER
 * Pure Vanilla JavaScript (ES Modules)
 * Handles mobile-first client views, 8-group slot reservation, synchronized lobby, 3 modes, and celebration screen.
 */

import { gameState } from "./game/state.js";
import { StarChampGame } from "./game/star-champ.js";
import { MemoryMadnessGame } from "./game/memory-madness.js";
import { NumberChainsGame } from "./game/number-chains.js";
import { sounds } from "./utils/sounds.js";
import { showToast, launchConfetti, openModal, closeModal } from "./utils/ui.js";
import { getPredicate } from "../data/questions.js";
import * as dbService from "./firebase/database.js";
import { callJoinGroup } from "./firebase/functions.js";
import { getDeviceToken, getFirebaseConfig } from "./firebase/config.js";
import { ensureAuthenticated } from "./firebase/auth.js";

class ThermoClientApp {
  constructor() {
    this.currentViewId = 'view-landing';
    this.activeGameInstance = null;
    this.sessionListenerUnsub = null;
    this.lobbyGroupsUnsub = null;
    this.leaderboardUnsub = null;
    this.selectedGroupNumber = null;
  }

  async init() {
    console.log('[ThermoApp] Initializing Thermo Champions: Heat Edition...');

    // Initialize Firebase Auth anonymously
    try {
      await ensureAuthenticated();
    } catch (e) {
      console.warn('[ThermoApp] Auth initialization warning:', e);
    }

    // Bind navigation buttons and global events
    this.bindEvents();

    // Check URL parameters for session code (e.g. ?session=TC-7929)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionCodeParam = urlParams.get('session');
    if (sessionCodeParam) {
      const sessInput = document.getElementById('reg-session-code');
      if (sessInput) sessInput.value = sessionCodeParam.trim().toUpperCase();
    }

    // Check for existing session rehydration
    if (gameState.session && gameState.group) {
      this.rehydrateSession();
    } else {
      this.showView('landing');
    }

    this.updateNavbarPills();
  }

  bindEvents() {
    // Sound Toggle Button
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = sounds.toggleMute();
        btnSound.innerHTML = isMuted ? '<span>🔇</span>' : '<span>🔊</span>';
        showToast(isMuted ? 'Suara dimatikan' : 'Suara diaktifkan', 'info');
      });
    }

    // Brand click returns to appropriate screen
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.addEventListener('click', () => {
        if (!gameState.group) {
          this.showView('landing');
        }
      });
    }

    // "Mulai Bermain" buttons
    document.querySelectorAll('.btn-trigger-start').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.click();
        if (gameState.group && gameState.session) {
          if (gameState.isAllModesComplete()) {
            this.showResultsScreen();
          } else if (gameState.activeMode) {
            this.launchMode(gameState.activeMode);
          } else {
            this.showLobbyScreen();
          }
        } else {
          this.showView('register');
          this.renderGroupSlotsGrid();
        }
      });
    });

    // Registration Form Inputs
    const btnVerifySession = document.getElementById('btn-verify-session');
    if (btnVerifySession) {
      btnVerifySession.addEventListener('click', () => this.verifySessionCode());
    }

    const regSessionInput = document.getElementById('reg-session-code');
    if (regSessionInput) {
      regSessionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.verifySessionCode();
      });
      regSessionInput.addEventListener('input', () => {
        regSessionInput.value = regSessionInput.value.toUpperCase();
      });
    }

    // Confirm Registration Button
    const btnConfirmReg = document.getElementById('btn-confirm-registration');
    if (btnConfirmReg) {
      btnConfirmReg.addEventListener('click', () => this.handleGroupRegistration());
    }

    // Navbar Action Buttons
    const btnNavLeaderboard = document.getElementById('btn-nav-leaderboard');
    if (btnNavLeaderboard) {
      btnNavLeaderboard.addEventListener('click', () => {
        sounds.click();
        this.openLeaderboardModal();
      });
    }

    const btnNavMaterial = document.getElementById('btn-nav-material');
    if (btnNavMaterial) {
      btnNavMaterial.addEventListener('click', () => {
        sounds.click();
        this.showView('material');
      });
    }

    const btnNavHelp = document.getElementById('btn-nav-help');
    if (btnNavHelp) {
      btnNavHelp.addEventListener('click', () => {
        sounds.click();
        openModal('modal-help');
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.style.display = 'none';
      });
    });

    // Leave Lobby Button
    const btnLeaveLobby = document.getElementById('btn-leave-lobby');
    if (btnLeaveLobby) {
      btnLeaveLobby.addEventListener('click', () => this.handleLeaveLobby());
    }

    // Restart / Logout Button in Results
    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        if (confirm('Keluar dari sesi pertandingan kelompok ini?')) {
          gameState.clear();
          window.location.reload();
        }
      });
    }

    // Print Certificate
    const btnPrintCert = document.getElementById('btn-print-cert');
    if (btnPrintCert) {
      btnPrintCert.addEventListener('click', () => {
        window.print();
      });
    }
  }

  showView(viewName) {
    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetId = `view-${viewName}`;
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      this.currentViewId = targetId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.updateNavbarPills();
  }

  updateNavbarPills() {
    const sessionPill = document.getElementById('nav-session-pill');
    const groupPill = document.getElementById('nav-group-pill');
    const guestBtn = document.getElementById('nav-guest-btn');
    const sessionCodeSpan = document.getElementById('nav-session-code');
    const chipName = document.getElementById('nav-chip-name');
    const chipScore = document.getElementById('nav-chip-score');
    const chipNomor = document.getElementById('nav-chip-nomor');

    if (gameState.session && sessionPill && sessionCodeSpan) {
      sessionPill.style.display = 'inline-flex';
      sessionCodeSpan.textContent = `SESI: ${gameState.session.sessionCode}`;
    } else if (sessionPill) {
      sessionPill.style.display = 'none';
    }

    if (gameState.group && groupPill) {
      groupPill.style.display = 'inline-flex';
      if (guestBtn) guestBtn.style.display = 'none';
      if (chipName) chipName.textContent = gameState.group.groupName;
      if (chipNomor) chipNomor.textContent = `K-${gameState.group.groupNumber}`;
      if (chipScore) chipScore.textContent = `${gameState.scores.total || 0} / 100 Pts`;
    } else {
      if (groupPill) groupPill.style.display = 'none';
      if (guestBtn) guestBtn.style.display = 'inline-flex';
    }
  }

  // ==========================================================================
  // REGISTRATION & 8-GROUP ATOMIC SLOTS
  // ==========================================================================

  async verifySessionCode() {
    const input = document.getElementById('reg-session-code');
    const msgEl = document.getElementById('session-verify-msg');
    const code = (input.value || '').trim().toUpperCase();

    if (!code) {
      showToast('Masukkan kode sesi terlebih dahulu!', 'warning');
      return;
    }

    if (msgEl) {
      msgEl.innerHTML = '<span style="color:#2563eb;">Memeriksa kode sesi...</span>';
    }

    try {
      const res = await dbService.getSessionByCode(code);
      if (!res || !res.session) {
        if (msgEl) msgEl.innerHTML = '<span style="color:#dc2626;">❌ Kode sesi tidak ditemukan. Pastikan kode benar dari Guru!</span>';
        showToast('Kode sesi tidak valid', 'error');
        return;
      }

      gameState.setSession(res.session);

      if (msgEl) {
        msgEl.innerHTML = `<span style="color:#16a34a; font-weight:700;">✓ Sesi Aktif: "${res.session.title}" (${res.session.sessionCode})</span>`;
      }

      showToast(`Terhubung ke sesi: ${res.session.title}`, 'success');

      // Subscribe to lobby slots for this session
      this.subscribeToLobbySlots(res.sessionId);

      // Reveal step 2 of registration
      const step2 = document.getElementById('reg-step-group-select');
      if (step2) step2.style.display = 'block';

      this.updateNavbarPills();
    } catch (err) {
      console.error('[ThermoApp] Session verify error:', err);
      if (msgEl) msgEl.innerHTML = '<span style="color:#dc2626;">Terjadi kesalahan koneksi database.</span>';
    }
  }

  subscribeToLobbySlots(sessionId) {
    if (this.lobbyGroupsUnsub) this.lobbyGroupsUnsub();

    this.lobbyGroupsUnsub = dbService.listenToLobbyGroups(sessionId, (groups) => {
      this.renderGroupSlotsGrid(groups);
    });
  }

  renderGroupSlotsGrid(occupiedGroups = {}) {
    const container = document.getElementById('group-slots-grid');
    if (!container) return;

    container.innerHTML = '';
    const myDeviceToken = getDeviceToken();

    for (let num = 1; num <= 8; num++) {
      const groupKey = `group${num}`;
      const groupData = occupiedGroups[groupKey];
      const isOccupied = !!groupData;
      const isMySlot = isOccupied && (groupData.deviceToken === myDeviceToken);

      const card = document.createElement('div');
      card.className = `group-slot-card ${isOccupied && !isMySlot ? 'slot-occupied' : 'slot-available'} ${this.selectedGroupNumber === num ? 'slot-selected' : ''}`;
      card.dataset.num = num;

      let statusBadge = '<span class="slot-badge badge-free">Tersedia</span>';
      if (isMySlot) {
        statusBadge = '<span class="slot-badge badge-mine">Kelompok Anda</span>';
      } else if (isOccupied) {
        statusBadge = `<span class="slot-badge badge-taken">Terisi: ${groupData.groupName || 'Kelompok ' + num}</span>`;
      }

      card.innerHTML = `
        <div class="slot-number-bubble">K-${num}</div>
        <div class="slot-title">Kelompok ${num}</div>
        <div class="slot-status">${statusBadge}</div>
      `;

      if (!isOccupied || isMySlot) {
        card.addEventListener('click', () => {
          sounds.click();
          this.selectedGroupNumber = num;
          document.querySelectorAll('.group-slot-card').forEach(c => c.classList.remove('slot-selected'));
          card.classList.add('slot-selected');

          // Pre-fill group name if empty
          const nameInput = document.getElementById('reg-group-name');
          if (nameInput && !nameInput.value) {
            nameInput.value = `Kelompok ${num}`;
          }

          // Enable confirm button
          const btnConfirm = document.getElementById('btn-confirm-registration');
          if (btnConfirm) btnConfirm.disabled = false;
        });
      }

      container.appendChild(card);
    }
  }

  async handleGroupRegistration() {
    if (!this.selectedGroupNumber) {
      showToast('Pilih salah satu nomor kelompok yang tersedia!', 'warning');
      return;
    }

    if (!gameState.session) {
      showToast('Kode sesi belum diverifikasi!', 'error');
      return;
    }

    const nameInput = document.getElementById('reg-group-name');
    const membersTextarea = document.getElementById('reg-members-list');
    const groupName = (nameInput.value || `Kelompok ${this.selectedGroupNumber}`).trim();

    // Parse members list (separated by newline or comma)
    const rawMembers = (membersTextarea.value || '').trim();
    const members = rawMembers
      .split(/[\n,]+/)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (members.length === 0) {
      showToast('Masukkan minimal 1 nama anggota kelompok!', 'warning');
      if (membersTextarea) membersTextarea.focus();
      return;
    }

    const btnConfirm = document.getElementById('btn-confirm-registration');
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Mendaftarkan Kelompok...';
    }

    try {
      const deviceToken = getDeviceToken();
      const res = await callJoinGroup(
        gameState.session.id,
        this.selectedGroupNumber,
        groupName,
        members,
        deviceToken
      );

      if (!res || !res.success) {
        showToast(res ? res.message : 'Gagal mendaftar slot kelompok.', 'error');
        if (btnConfirm) {
          btnConfirm.disabled = false;
          btnConfirm.textContent = 'Konfirmasi dan Masuk Ruang Tunggu';
        }
        return;
      }

      // Successfully claimed slot!
      sounds.fanfare();
      gameState.setGroup(res.group);
      showToast(`Berhasil mendaftar sebagai ${groupName}!`, 'success');

      this.showLobbyScreen();
    } catch (err) {
      console.error('[ThermoApp] Group registration error:', err);
      showToast('Terjadi kesalahan saat pendaftaran slot.', 'error');
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Konfirmasi dan Masuk Ruang Tunggu';
      }
    }
  }

  // ==========================================================================
  // WAITING ROOM (LOBBY) & SYNCHRONIZED START
  // ==========================================================================

  showLobbyScreen() {
    this.showView('lobby');

    const group = gameState.group;
    const session = gameState.session;
    if (!group || !session) return;

    // Fill Lobby Header
    const nameEl = document.getElementById('lobby-group-name');
    const codeEl = document.getElementById('lobby-session-code');
    const membersListEl = document.getElementById('lobby-members-list');

    if (nameEl) nameEl.textContent = `${group.groupName} (Kelompok ${group.groupNumber})`;
    if (codeEl) codeEl.textContent = session.sessionCode;

    if (membersListEl) {
      membersListEl.innerHTML = '';
      (group.members || []).forEach((mem, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>👤</span> <span>${mem}</span>`;
        membersListEl.appendChild(li);
      });
    }

    // Subscribe to Session changes (Guru broadcasts "started")
    if (this.sessionListenerUnsub) this.sessionListenerUnsub();
    this.sessionListenerUnsub = dbService.listenToSession(session.id, (sessData) => {
      if (!sessData) return;

      if (sessData.status === 'started') {
        this.startCountdownOverlay();
      } else if (sessData.status === 'paused') {
        showToast('Turnamen sedang dijeda oleh Guru.', 'warning');
      }
    });

    // Subscribe to all 8 groups in lobby
    const lobbyStatusGrid = document.getElementById('lobby-other-groups-grid');
    if (this.lobbyGroupsUnsub) this.lobbyGroupsUnsub();
    this.lobbyGroupsUnsub = dbService.listenToLobbyGroups(session.id, (groups) => {
      if (!lobbyStatusGrid) return;
      lobbyStatusGrid.innerHTML = '';
      let readyCount = 0;

      for (let n = 1; n <= 8; n++) {
        const g = groups[`group${n}`];
        const card = document.createElement('div');
        card.className = `lobby-peer-card ${g ? 'peer-ready' : 'peer-waiting'}`;

        if (g) {
          readyCount++;
          card.innerHTML = `
            <div class="peer-num">K-${n}</div>
            <div class="peer-info">
              <div class="peer-name">${g.groupName}</div>
              <div class="peer-status">🟢 Siap di Ruang Tunggu (${(g.members || []).length} Siswa)</div>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="peer-num">K-${n}</div>
            <div class="peer-info">
              <div class="peer-name">Kelompok ${n}</div>
              <div class="peer-status">⚪ Menunggu bergabung...</div>
            </div>
          `;
        }
        lobbyStatusGrid.appendChild(card);
      }

      const countBadge = document.getElementById('lobby-count-badge');
      if (countBadge) {
        countBadge.textContent = `${readyCount} dari 8 Kelompok Siap`;
      }
    });
  }

  async handleLeaveLobby() {
    if (!confirm('Apakah kelompok Anda yakin ingin keluar dari ruang tunggu?')) return;

    const group = gameState.group;
    const session = gameState.session;
    if (group && session) {
      await dbService.releaseGroupSlot(session.id, group.groupNumber, group.deviceToken);
    }

    gameState.clear();
    this.showView('landing');
    showToast('Telah keluar dari ruang tunggu.', 'info');
  }

  // ==========================================================================
  // SYNCHRONIZED COUNTDOWN OVERLAY
  // ==========================================================================

  startCountdownOverlay() {
    // Prevent double launch
    if (this.activeGameInstance) return;

    if (this.sessionListenerUnsub) {
      this.sessionListenerUnsub();
      this.sessionListenerUnsub = null;
    }

    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');
    if (!overlay || !numEl) {
      this.launchMode('quiz');
      return;
    }

    overlay.style.display = 'flex';
    let count = 3;
    numEl.textContent = count;
    sounds.countdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.textContent = count;
        sounds.countdown(count);
      } else if (count === 0) {
        numEl.textContent = 'MULAI!';
        numEl.style.color = '#f97316';
        sounds.countdown(0);
      } else {
        clearInterval(interval);
        overlay.style.display = 'none';
        this.launchMode('quiz');
      }
    }, 1000);
  }

  // ==========================================================================
  // GAME MODES LAUNCHER & ORCHESTRATION
  // ==========================================================================

  launchMode(modeKey) {
    if (this.activeGameInstance) {
      this.activeGameInstance.destroy();
      this.activeGameInstance = null;
    }

    gameState.activeMode = modeKey;
    this.updateNavbarPills();

    if (modeKey === 'quiz') {
      this.showView('starchamp');
      this.activeGameInstance = new StarChampGame({
        onUpdateScore: (newScores) => this.handleScoreUpdate(newScores),
        onComplete: (data) => this.handleModeCompletion('quiz', data)
      });
      this.activeGameInstance.init();
    } else if (modeKey === 'memory') {
      this.showView('memory');
      this.activeGameInstance = new MemoryMadnessGame({
        onUpdateScore: (newScores) => this.handleScoreUpdate(newScores),
        onComplete: (data) => this.handleModeCompletion('memory', data)
      });
      this.activeGameInstance.init();
    } else if (modeKey === 'calc') {
      this.showView('chains');
      this.activeGameInstance = new NumberChainsGame({
        onUpdateScore: (newScores) => this.handleScoreUpdate(newScores),
        onComplete: (data) => this.handleModeCompletion('calc', data)
      });
      this.activeGameInstance.init();
    }
  }

  handleScoreUpdate(newScores) {
    this.updateNavbarPills();
  }

  handleModeCompletion(completedMode, resultData) {
    sounds.stageComplete();
    this.updateNavbarPills();

    // Mode transitions
    if (completedMode === 'quiz') {
      this.showModeTransitionModal({
        title: 'StarChamp Kalor Selesai!',
        scoreAchieved: gameState.scores.quiz,
        maxScore: 35,
        nextModeName: 'Mode 2: Memory Madness',
        nextModeDesc: 'Bersiaplah untuk Fase Menghafal 10 Kartu Fakta Kalor selama 30 detik bersama kelompok!',
        onProceed: () => this.launchMode('memory')
      });
    } else if (completedMode === 'memory') {
      this.showModeTransitionModal({
        title: 'Memory Madness Tuntas!',
        scoreAchieved: gameState.scores.memory,
        maxScore: 30,
        nextModeName: 'Mode 3: Number Chains (Hitungan Kalor)',
        nextModeDesc: 'Arena pamungkas! Selesaikan 5 tahap perhitungan kalor bertingkat dari mudah hingga rantai bertingkat.',
        onProceed: () => this.launchMode('calc')
      });
    } else if (completedMode === 'calc') {
      this.showResultsScreen();
    }
  }

  showModeTransitionModal({ title, scoreAchieved, maxScore, nextModeName, nextModeDesc, onProceed }) {
    const modal = document.getElementById('modal-mode-transition');
    if (!modal) {
      if (onProceed) onProceed();
      return;
    }

    const titleEl = document.getElementById('trans-title');
    const scoreEl = document.getElementById('trans-score');
    const nextNameEl = document.getElementById('trans-next-name');
    const nextDescEl = document.getElementById('trans-next-desc');
    const proceedBtn = document.getElementById('btn-trans-proceed');

    if (titleEl) titleEl.textContent = title;
    if (scoreEl) scoreEl.textContent = `${scoreAchieved} / ${maxScore} Poin`;
    if (nextNameEl) nextNameEl.textContent = nextModeName;
    if (nextDescEl) nextDescEl.textContent = nextModeDesc;

    modal.style.display = 'flex';

    if (proceedBtn) {
      proceedBtn.onclick = () => {
        sounds.click();
        modal.style.display = 'none';
        if (onProceed) onProceed();
      };
    }
  }

  // ==========================================================================
  // FINAL RESULTS & CELEBRATION
  // ==========================================================================

  showResultsScreen() {
    this.showView('results');
    sounds.fanfare();
    launchConfetti(4500);

    const group = gameState.group;
    const scores = gameState.scores;
    const finalTotal = scores.total || 0;
    const pred = getPredicate(finalTotal);

    // Update Certificate & Summary elements
    const certGroupName = document.getElementById('cert-group-name');
    const certMembers = document.getElementById('cert-members');
    const certTotalScore = document.getElementById('cert-total-score');
    const certBadge = document.getElementById('cert-predicate-badge');
    const certTitle = document.getElementById('cert-predicate-title');
    const certMsg = document.getElementById('cert-predicate-msg');

    const resScoreQuiz = document.getElementById('res-score-quiz');
    const resScoreMem = document.getElementById('res-score-mem');
    const resScoreCalc = document.getElementById('res-score-calc');
    const resScoreTotal = document.getElementById('res-score-total');

    if (certGroupName && group) certGroupName.textContent = `${group.groupName} (Kelompok ${group.groupNumber})`;
    if (certMembers && group) certMembers.textContent = (group.members || []).join(' • ');
    if (certTotalScore) certTotalScore.textContent = `${finalTotal}`;
    if (certBadge) certBadge.textContent = pred.badge;
    if (certTitle) certTitle.textContent = pred.title;
    if (certMsg) certMsg.textContent = pred.msg;

    if (resScoreQuiz) resScoreQuiz.textContent = `${scores.quiz || 0} / 35`;
    if (resScoreMem) resScoreMem.textContent = `${scores.memory || 0} / 30`;
    if (resScoreCalc) resScoreCalc.textContent = `${scores.calc || 0} / 35`;
    if (resScoreTotal) resScoreTotal.textContent = `${finalTotal} / 100`;

    // Subscribe to live tournament leaderboard inside result view
    if (gameState.session) {
      this.subscribeToResultLeaderboard(gameState.session.id);
    }
  }

  subscribeToResultLeaderboard(sessionId) {
    const tbody = document.getElementById('results-leaderboard-tbody');
    if (!tbody) return;

    if (this.leaderboardUnsub) this.leaderboardUnsub();
    this.leaderboardUnsub = dbService.listenToLeaderboard(sessionId, (rankingList) => {
      tbody.innerHTML = '';
      if (!rankingList || rankingList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--slate-400);">Belum ada kelompok lain yang selesai.</td></tr>';
        return;
      }

      rankingList.forEach((row, idx) => {
        const isMyGroup = gameState.group && (row.groupNumber === gameState.group.groupNumber);
        const tr = document.createElement('tr');
        if (isMyGroup) tr.className = 'my-group-row';

        const rankBadges = ['🥇', '🥈', '🥉'];
        const rankDisplay = rankBadges[idx] || `#${idx + 1}`;

        tr.innerHTML = `
          <td style="font-weight:900; text-align:center;">${rankDisplay}</td>
          <td><strong>Kelompok ${row.groupNumber}</strong></td>
          <td>${row.groupName}</td>
          <td style="text-align:center; font-family:monospace; font-weight:800; color:var(--orange);">${row.totalSkor || 0}</td>
          <td><span class="badge-predicate">${row.predicate || 'THERMAL ROOKIE'}</span></td>
          <td>${row.status === 'finished' ? '🏁 Selesai' : '⏳ Bertanding'}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  // ==========================================================================
  // STANDALONE LEADERBOARD MODAL
  // ==========================================================================

  openLeaderboardModal() {
    openModal('modal-leaderboard');
    const sessionId = gameState.session ? gameState.session.id : null;
    const tbody = document.getElementById('modal-leaderboard-tbody');
    if (!tbody) return;

    if (!sessionId) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--slate-400);">Belum terhubung ke sesi turnamen.</td></tr>';
      return;
    }

    dbService.listenToLeaderboard(sessionId, (rankingList) => {
      tbody.innerHTML = '';
      if (!rankingList || rankingList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--slate-400);">Belum ada skor yang tercatat.</td></tr>';
        return;
      }

      rankingList.forEach((row, idx) => {
        const tr = document.createElement('tr');
        const rankBadges = ['🥇', '🥈', '🥉'];
        const rankDisplay = rankBadges[idx] || `#${idx + 1}`;

        tr.innerHTML = `
          <td style="font-weight:900; text-align:center;">${rankDisplay}</td>
          <td><strong>Kelompok ${row.groupNumber}</strong></td>
          <td>${row.groupName}</td>
          <td style="text-align:center; font-family:monospace; font-weight:800; color:var(--orange);">${row.totalSkor || 0}</td>
          <td><span class="badge-predicate">${row.predicate || 'THERMAL ROOKIE'}</span></td>
          <td>${row.status === 'finished' ? '🏁 Selesai' : '⏳ Bertanding'}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  // ==========================================================================
  // REHYDRATION (SESSION RECOVERY)
  // ==========================================================================

  rehydrateSession() {
    console.log('[ThermoApp] Rehydrating session from LocalStorage...');
    showToast(`Memulihkan sesi: ${gameState.session.sessionCode}`, 'info');

    if (gameState.isAllModesComplete()) {
      this.showResultsScreen();
    } else if (gameState.activeMode) {
      this.launchMode(gameState.activeMode);
    } else {
      this.showLobbyScreen();
    }
  }
}

// Instantiate and expose globally for inline HTML event bindings
window.app = new ThermoClientApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
