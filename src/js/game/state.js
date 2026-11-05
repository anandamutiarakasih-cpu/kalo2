/**
 * THERMO CHAMPIONS: HEAT EDITION — CLIENT GAME STATE & REHYDRATION
 * Manages active group state, scores, and session recovery across page refreshes.
 */

import { STORAGE_KEYS } from "../firebase/config.js";

class GameState {
  constructor() {
    this.session = null;
    this.group = null;
    this.currentView = 'landing';
    this.activeMode = null; // 'quiz' | 'memory' | 'calc' | null
    this.scores = {
      quiz: 0,
      memory: 0,
      calc: 0,
      total: 0
    };
    this.completedModes = {
      quiz: false,
      memory: false,
      calc: false
    };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const sessStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (sessStr) this.session = JSON.parse(sessStr);

      const grpStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
      if (grpStr) {
        this.group = JSON.parse(grpStr);
        if (this.group.scores) this.scores = { ...this.scores, ...this.group.scores };
        if (this.group.completedModes) this.completedModes = { ...this.completedModes, ...this.group.completedModes };
      }
    } catch (e) {
      console.warn('[GameState] Could not restore saved state:', e);
    }
  }

  saveToStorage() {
    try {
      if (this.session) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(this.session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }

      if (this.group) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(this.group));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);
      }
    } catch (e) {
      console.warn('[GameState] Could not persist state:', e);
    }
  }

  setSession(session) {
    this.session = session;
    this.saveToStorage();
  }

  setGroup(group) {
    this.group = group;
    if (group && group.scores) {
      this.scores = { ...this.scores, ...group.scores };
    }
    if (group && group.completedModes) {
      this.completedModes = { ...this.completedModes, ...group.completedModes };
    }
    this.saveToStorage();
  }

  updateScores(newScores) {
    if (!newScores) return;
    this.scores = { ...this.scores, ...newScores };
    if (this.group) {
      this.group.scores = this.scores;
    }
    this.saveToStorage();
  }

  markModeDone(modeKey) {
    this.completedModes[modeKey] = true;
    if (this.group) {
      this.group.completedModes = this.completedModes;
    }
    this.saveToStorage();
  }

  isAllModesComplete() {
    return this.completedModes.quiz && this.completedModes.memory && this.completedModes.calc;
  }

  clear() {
    this.session = null;
    this.group = null;
    this.activeMode = null;
    this.scores = { quiz: 0, memory: 0, calc: 0, total: 0 };
    this.completedModes = { quiz: false, memory: false, calc: false };
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);
  }
}

export const gameState = new GameState();
