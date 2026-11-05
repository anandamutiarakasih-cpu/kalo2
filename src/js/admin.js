/**
 * THERMO CHAMPIONS: HEAT EDITION — GAME MASTER & ADMIN CONTROLLER
 * Pure Vanilla JavaScript (ES Modules)
 * Handles session creation, 8-group live lobby monitoring, synchronized start broadcast,
 * live real-time leaderboard, activity stream, and CSV export.
 */

import * as dbService from "./firebase/database.js";
import { callCreateSession, callStartSession } from "./firebase/functions.js";
import { getFirebaseConfig, setFirebaseConfig, STORAGE_KEYS } from "./firebase/config.js";
import { ensureAuthenticated } from "./firebase/auth.js";
import { sounds } from "./utils/sounds.js";
import { showToast, openModal, closeModal } from "./utils/ui.js";

class ThermoAdminApp {
  constructor() {
    this.currentSessionId = null;
    this.currentSession = null;
    this.sessionListenerUnsub = null;
    this.lobbyListenerUnsub = null;
    this.leaderboardListenerUnsub = null;
    this.connectedGroups = {};
    this.activityLog = [];
  }

  async init() {
    console.log('[ThermoAdmin] Initializing Game Master Admin Dashboard...');

    this.bindEvents();
    this.loadStoredConfig();

    // Listen to live database connection status
    dbService.listenToConnection((isConnected, err) => {
      if (isConnected) {
        this.updateConnectionStatus(true, 'Firebase Terhubung');
        this.toggleAlertBanner(false);
      } else {
        const msg = err && err.message ? err.message : 'Database Belum Terhubung';
        this.updateConnectionStatus(false, 'Offline / Belum Terhubung');
        this.toggleAlertBanner(true, msg);
      }
    });

    try {
      await ensureAuthenticated();
    } catch (e) {
      console.warn('[ThermoAdmin] Firebase auth warning:', e);
      this.updateConnectionStatus(false, 'Auth Belum Aktif');
      this.toggleAlertBanner(true, e.message);
    }

    // Check if there is an active session id stored in localStorage
    const savedSessId = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION_ID);
    if (savedSessId) {
      this.loadSession(savedSessId);
    }
  }

  loadStoredConfig() {
    const cfg = getFirebaseConfig();
    const urlInput = document.getElementById('cfg-firebase-url');
    if (urlInput && cfg && cfg.databaseURL) {
      urlInput.value = cfg.databaseURL;
    }
  }

  updateConnectionStatus(isOnline, text) {
    const pill = document.getElementById('connection-pill');
    const label = document.getElementById('connection-text');
    if (!pill || !label) return;

    if (isOnline) {
      pill.className = 'connection-status status-online';
      label.textContent = text || 'Firebase Terhubung';
    } else {
      pill.className = 'connection-status status-offline';
      label.textContent = text || 'Offline';
    }
  }

  toggleAlertBanner(show, customMessage = '') {
    const banner = document.getElementById('firebase-alert-banner');
    const textEl = document.getElementById('firebase-alert-text');
    if (!banner) return;

    if (show) {
      banner.style.display = 'block';
      if (textEl && customMessage) {
        textEl.textContent = customMessage;
      }
    } else {
      banner.style.display = 'none';
    }
  }

  bindEvents() {
    // Config Save & Test
    const btnSaveCfg = document.getElementById('btn-save-config');
    if (btnSaveCfg) {
      btnSaveCfg.addEventListener('click', () => this.handleSaveConfig());
    }

    // Preset buttons
    const btnPresetSg = document.getElementById('btn-preset-sg');
    if (btnPresetSg) {
      btnPresetSg.addEventListener('click', () => {
        const urlInput = document.getElementById('cfg-firebase-url');
        if (urlInput) urlInput.value = 'https://kalor3-ff4af-default-rtdb.asia-southeast1.firebasedatabase.app';
        this.handleSaveConfig();
      });
    }

    const btnPresetUs = document.getElementById('btn-preset-us');
    if (btnPresetUs) {
      btnPresetUs.addEventListener('click', () => {
        const urlInput = document.getElementById('cfg-firebase-url');
        if (urlInput) urlInput.value = 'https://kalor3-ff4af-default-rtdb.firebaseio.com';
        this.handleSaveConfig();
      });
    }

    // Setup Guide Modal
    const btnOpenGuide = document.getElementById('btn-open-setup-guide');
    if (btnOpenGuide) {
      btnOpenGuide.addEventListener('click', () => openModal('modal-setup-guide'));
    }

    const btnCloseGuide = document.getElementById('btn-close-setup-guide');
    if (btnCloseGuide) {
      btnCloseGuide.addEventListener('click', () => closeModal('modal-setup-guide'));
    }

    const btnAckGuide = document.getElementById('btn-ack-setup-guide');
    if (btnAckGuide) {
      btnAckGuide.addEventListener('click', () => closeModal('modal-setup-guide'));
    }

    // Modal: Buat Sesi Baru
    const btnOpenCreate = document.getElementById('btn-open-create-modal');
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => {
        sounds.click();
        openModal('modal-create-session');
      });
    }

    const btnCancelCreate = document.getElementById('btn-cancel-create');
    if (btnCancelCreate) {
      btnCancelCreate.addEventListener('click', () => {
        closeModal('modal-create-session');
      });
    }

    const btnConfirmCreate = document.getElementById('btn-confirm-create');
    if (btnConfirmCreate) {
      btnConfirmCreate.addEventListener('click', () => this.handleCreateSession());
    }

    // Copy Code & Link
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (!this.currentSession) {
          showToast('Belum ada sesi aktif!', 'warning');
          return;
        }
        navigator.clipboard.writeText(this.currentSession.sessionCode);
        showToast(`Kode sesi ${this.currentSession.sessionCode} disalin ke clipboard!`, 'success');
      });
    }

    const btnCopyLink = document.getElementById('btn-copy-link');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        if (!this.currentSession) {
          showToast('Belum ada sesi aktif!', 'warning');
          return;
        }
        const cleanBase = window.location.href.split('?')[0].replace(/\/admin(?:\.html)?\/?$/, '');
        const studentUrl = cleanBase + '/index.html';
        const cfg = getFirebaseConfig();
        const dbParam = cfg && cfg.databaseURL ? `&db=${encodeURIComponent(cfg.databaseURL)}` : '';
        const link = `${studentUrl}?session=${this.currentSession.sessionCode}${dbParam}`;
        navigator.clipboard.writeText(link);
        showToast('Link HP Siswa (dengan sinkronisasi database) disalin! Bagikan ke grup kelas.', 'success');
      });
    }

    // Big Hero Action: MULAI BERSAMA SELURUH KELOMPOK
    const btnStartTogether = document.getElementById('btn-start-together');
    if (btnStartTogether) {
      btnStartTogether.addEventListener('click', () => this.handleStartTogether());
    }

    // Control buttons: Pause, Resume, End, Reset
    const btnPause = document.getElementById('btn-pause-session');
    if (btnPause) {
      btnPause.addEventListener('click', () => this.handlePauseSession());
    }

    const btnResume = document.getElementById('btn-resume-session');
    if (btnResume) {
      btnResume.addEventListener('click', () => this.handleResumeSession());
    }

    const btnComplete = document.getElementById('btn-complete-session');
    if (btnComplete) {
      btnComplete.addEventListener('click', () => this.handleEndSession());
    }

    const btnReset = document.getElementById('btn-reset-session');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.handleResetSession());
    }

    // Export CSV
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => this.exportLeaderboardToCSV());
    }
  }

  handleSaveConfig() {
    const urlInput = document.getElementById('cfg-firebase-url');
    const url = (urlInput.value || '').trim();
    if (!url) {
      showToast('Masukkan URL Firebase Database yang valid!', 'warning');
      return;
    }

    const cfg = getFirebaseConfig();
    cfg.databaseURL = url;
    setFirebaseConfig(cfg);

    showToast('Konfigurasi disimpan. Memuat ulang...', 'success');
    setTimeout(() => window.location.reload(), 600);
  }

  async handleCreateSession() {
    const titleInput = document.getElementById('new-session-title');
    const codeInput = document.getElementById('new-session-code');

    const title = (titleInput.value || 'Turnamen Kalor IPA SMP').trim();
    const customCode = (codeInput.value || '').trim().toUpperCase();

    const btnConfirm = document.getElementById('btn-confirm-create');
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Membuat Sesi...';
    }

    try {
      const res = await callCreateSession(title, customCode);
      if (res && res.success) {
        closeModal('modal-create-session');
        sounds.fanfare();
        showToast(`Sesi "${title}" (${res.sessionCode}) berhasil dibuat!`, 'success');
        this.loadSession(res.sessionId);
      } else {
        showToast('Gagal membuat sesi. Periksa koneksi database.', 'error');
      }
    } catch (err) {
      console.error('[ThermoAdmin] Create session error:', err);
      showToast('Terjadi kesalahan saat membuat sesi.', 'error');
    } finally {
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Buat Sesi Sekarang';
      }
    }
  }

  loadSession(sessionId) {
    this.currentSessionId = sessionId;
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION_ID, sessionId);

    // Unsubscribe previous listeners
    if (this.sessionListenerUnsub) this.sessionListenerUnsub();
    if (this.lobbyListenerUnsub) this.lobbyListenerUnsub();
    if (this.leaderboardListenerUnsub) this.leaderboardListenerUnsub();

    // 1. Listen to Session Details
    this.sessionListenerUnsub = dbService.listenToSession(sessionId, (sess) => {
      this.currentSession = sess;
      this.renderSessionInfo(sess);
    });

    // 2. Listen to 8 Groups in Lobby
    this.lobbyListenerUnsub = dbService.listenToLobbyGroups(sessionId, (groups) => {
      this.connectedGroups = groups || {};
      this.renderLobbyGrid(this.connectedGroups);
      this.updateStartButtonState();
    });

    // 3. Listen to Leaderboard Updates
    this.leaderboardListenerUnsub = dbService.listenToLeaderboard(sessionId, (rankingList) => {
      this.renderLeaderboardTable(rankingList);
    });
  }

  renderSessionInfo(session) {
    if (!session) return;

    const codeDisplay = document.getElementById('session-code-display');
    const titleDisplay = document.getElementById('session-title-display');
    const statusBadge = document.getElementById('session-status-badge');

    if (codeDisplay) codeDisplay.textContent = session.sessionCode || '------';
    if (titleDisplay) titleDisplay.textContent = `${session.title} • ID: ${session.id}`;

    const statusMap = {
      waiting: { label: 'MENUNGGU KELOMPOK', color: '#2563eb' },
      started: { label: 'PERTANDINGAN BERJALAN', color: '#16a34a' },
      paused: { label: 'DIJEDA', color: '#d97706' },
      ended: { label: 'SELESAI', color: '#475569' }
    };

    const st = statusMap[session.status] || { label: session.status, color: '#475569' };
    if (statusBadge) {
      statusBadge.textContent = st.label;
      statusBadge.style.color = st.color;
    }

    // Toggle Pause/Resume button states
    const btnPause = document.getElementById('btn-pause-session');
    const btnResume = document.getElementById('btn-resume-session');
    const btnComplete = document.getElementById('btn-complete-session');
    const btnReset = document.getElementById('btn-reset-session');

    if (btnPause && btnResume) {
      if (session.status === 'started') {
        btnPause.style.display = 'inline-flex';
        btnPause.disabled = false;
        btnResume.style.display = 'none';
      } else if (session.status === 'paused') {
        btnPause.style.display = 'none';
        btnResume.style.display = 'inline-flex';
        btnResume.disabled = false;
      } else {
        btnPause.disabled = true;
        btnResume.disabled = true;
      }
    }

    if (btnComplete) btnComplete.disabled = (session.status === 'ended');
    if (btnReset) btnReset.disabled = false;
  }

  renderLobbyGrid(groups) {
    const container = document.getElementById('lobby-grid-container');
    const countBadge = document.getElementById('connected-count-badge');
    if (!container) return;

    container.innerHTML = '';
    let connectedCount = 0;

    for (let num = 1; num <= 8; num++) {
      const groupKey = `group${num}`;
      const group = groups[groupKey];
      const isOnline = !!group;

      if (isOnline) connectedCount++;

      const card = document.createElement('div');
      card.className = `lobby-card ${isOnline ? 'lobby-card-online' : 'lobby-card-offline'}`;

      if (isOnline) {
        const membersList = (group.members || []).map(m => `• ${m}`).join('<br>');
        const score = (group.scores && group.scores.total) || 0;

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span class="lobby-card-num">K-${num}</span>
            <span class="pulse-dot"></span>
          </div>
          <div class="lobby-card-name">${group.groupName}</div>
          <div class="lobby-card-members" title="${membersList}">
            ${(group.members || []).length} Anggota: ${(group.members || []).slice(0, 2).join(', ')}${(group.members || []).length > 2 ? '...' : ''}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.6rem; border-top:1px solid #e2e8f0; padding-top:0.4rem;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--deepblue);">${score} Pts</span>
            <span style="font-size:0.65rem; background:#dcfce7; color:#15803d; font-weight:800; padding:0.1rem 0.35rem; border-radius:0.25rem;">${group.status || 'ready'}</span>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span class="lobby-card-num">K-${num}</span>
            <span style="font-size:0.7rem; color:var(--slate-400);">Kosong</span>
          </div>
          <div class="lobby-card-name" style="color:var(--slate-400);">Kelompok ${num}</div>
          <div class="lobby-card-members" style="color:var(--slate-400);">Belum ada perangkat terhubung</div>
        `;
      }

      container.appendChild(card);
    }

    if (countBadge) {
      countBadge.textContent = `${connectedCount} / 8 Kelompok Terhubung`;
    }
  }

  updateStartButtonState() {
    const btnStart = document.getElementById('btn-start-together');
    const hint = document.getElementById('start-sync-hint');
    if (!btnStart) return;

    const connectedCount = Object.keys(this.connectedGroups).length;
    const isWaiting = this.currentSession && this.currentSession.status === 'waiting';

    if (connectedCount > 0 && isWaiting) {
      btnStart.disabled = false;
      if (hint) hint.innerHTML = `<span style="color:#16a34a; font-weight:700;">✓ ${connectedCount} kelompok siap di ruang tunggu! Klik tombol di atas untuk memulai pertandingan secara serentak.</span>`;
    } else if (!isWaiting && this.currentSession) {
      btnStart.disabled = true;
      if (hint) hint.textContent = 'Pertandingan telah dimulai.';
    } else {
      btnStart.disabled = true;
      if (hint) hint.textContent = 'Tombol akan aktif setelah minimal 1 kelompok bergabung di ruang tunggu.';
    }
  }

  async handleStartTogether() {
    if (!this.currentSessionId) return;

    const count = Object.keys(this.connectedGroups).length;
    if (count === 0) {
      showToast('Belum ada kelompok di ruang tunggu!', 'warning');
      return;
    }

    if (!confirm(`Mulai turnamen sekarang untuk ${count} kelompok yang sudah berada di ruang tunggu? Seluruh perangkat siswa akan menghitung mundur dan masuk ke arena pertandingan secara serentak.`)) {
      return;
    }

    const btnStart = document.getElementById('btn-start-together');
    if (btnStart) {
      btnStart.disabled = true;
      btnStart.innerHTML = '<span>🚀</span> <span>MENYIARKAN SINYAL MULAI...</span>';
    }

    try {
      const res = await callStartSession(this.currentSessionId);
      if (res && res.success) {
        sounds.fanfare();
        showToast('Turnamen telah dimulai secara serentak!', 'success');
        this.addActivityLog(`Guru memulai pertandingan serentak untuk ${count} kelompok.`);
      }
    } catch (err) {
      console.error('[ThermoAdmin] Start tournament error:', err);
      showToast('Gagal menyiarkan sinyal mulai.', 'error');
    }
  }

  async handlePauseSession() {
    if (!this.currentSessionId) return;
    await dbService.pauseTournament(this.currentSessionId);
    showToast('Pertandingan dijeda.', 'info');
    this.addActivityLog('Guru menjeda pertandingan.');
  }

  async handleResumeSession() {
    if (!this.currentSessionId) return;
    await dbService.resumeTournament(this.currentSessionId);
    showToast('Pertandingan dilanjutkan!', 'success');
    this.addActivityLog('Guru melanjutkan pertandingan.');
  }

  async handleEndSession() {
    if (!this.currentSessionId) return;
    if (!confirm('Apakah Anda yakin ingin mengakhiri sesi pertandingan ini secara permanen?')) return;
    await dbService.endTournament(this.currentSessionId);
    showToast('Sesi pertandingan telah diakhiri.', 'info');
    this.addActivityLog('Guru mengakhiri sesi pertandingan.');
  }

  async handleResetSession() {
    if (!this.currentSessionId) return;
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh skor dan jawaban pada sesi ini kembali ke nol? Kelompok akan tetap terhubung di ruang tunggu.')) return;
    await dbService.resetSessionData(this.currentSessionId);
    showToast('Seluruh skor sesi berhasil direset!', 'success');
    this.addActivityLog('Guru mereset data dan skor sesi.');
  }

  renderLeaderboardTable(rankingList) {
    const tbody = document.getElementById('admin-leaderboard-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!rankingList || rankingList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align:center; padding:2rem; color:var(--slate-400);">
            Menunggu kelompok terhubung dan mulai bertanding...
          </td>
        </tr>
      `;
      return;
    }

    rankingList.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const rankBadges = ['🥇', '🥈', '🥉'];
      const rankDisplay = rankBadges[idx] || `#${idx + 1}`;

      const durSec = row.totalDurationSeconds || 0;
      const mins = Math.floor(durSec / 60);
      const secs = durSec % 60;
      const durStr = `${mins}m ${secs}s`;

      tr.innerHTML = `
        <td style="font-weight:900; text-align:center; font-size:1.1rem;">${rankDisplay}</td>
        <td><strong style="color:var(--deepblue);">Kelompok ${row.groupNumber}</strong></td>
        <td style="font-weight:700;">${row.groupName}</td>
        <td>${row.membersCount || 0} Siswa</td>
        <td style="text-align:center; font-family:monospace; font-weight:700;">${row.skorQuiz || 0}</td>
        <td style="text-align:center; font-family:monospace; font-weight:700;">${row.skorMemory || 0}</td>
        <td style="text-align:center; font-family:monospace; font-weight:700;">${row.skorNumberChains || 0}</td>
        <td style="text-align:center; font-family:monospace; font-weight:900; color:var(--orange); font-size:1.05rem;">${row.totalSkor || 0}</td>
        <td style="text-align:center; font-size:0.8rem; color:var(--slate-500);">${durStr}</td>
        <td><span class="badge-predicate">${row.predicate || 'THERMAL ROOKIE'}</span></td>
        <td>
          <span style="font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:0.25rem; ${row.status === 'finished' ? 'background:#dcfce7; color:#15803d;' : 'background:#eff6ff; color:#2563eb;'}">
            ${row.status === 'finished' ? '🏁 Selesai' : '⏳ Bertanding'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  addActivityLog(message) {
    const container = document.getElementById('live-feed-container');
    if (!container) return;

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `
      <span class="feed-time">${timeStr}</span>
      <span class="feed-msg">${message}</span>
    `;

    container.insertBefore(item, container.firstChild);

    // Limit to 20 entries
    while (container.children.length > 20) {
      container.removeChild(container.lastChild);
    }
  }

  exportLeaderboardToCSV() {
    if (!this.currentSessionId) {
      showToast('Belum ada sesi aktif!', 'warning');
      return;
    }

    const table = document.querySelector('.admin-table');
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      const cols = row.querySelectorAll('th, td');
      const rowData = [];
      cols.forEach(col => {
        let text = col.innerText.replace(/"/g, '""').trim();
        rowData.push(`"${text}"`);
      });
      csv.push(rowData.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURI(csv.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const code = this.currentSession ? this.currentSession.sessionCode : 'SESI';
    link.setAttribute('download', `rekap_turnamen_kalor_${code}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Laporan CSV berhasil diunduh!', 'success');
  }
}

window.adminApp = new ThermoAdminApp();
document.addEventListener('DOMContentLoaded', () => {
  window.adminApp.init();
});
