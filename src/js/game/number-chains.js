/**
 * THERMO CHAMPIONS: HEAT EDITION — MODE 3: NUMBER CHAINS
 * 5 Tahap Perhitungan Kalor Bertingkat — Total Maksimal 35 Poin (7 poin/tahap)
 */

import { NUMBER_CHAIN_STAGES } from "../../data/questions.js";
import { sounds } from "../utils/sounds.js";
import { SyncTimer } from "../utils/timer.js";
import { gameState } from "./state.js";
import { callSubmitAnswer } from "../firebase/functions.js";
import { markModeCompleted, finishGroupGame } from "../firebase/database.js";

export class NumberChainsGame {
  constructor({ onComplete, onUpdateScore }) {
    this.onComplete = onComplete;
    this.onUpdateScore = onUpdateScore;
    this.currentStageIndex = 0;
    this.timer = null;
    this.stageStartTime = 0;
  }

  init() {
    this.currentStageIndex = 0;
    this.renderStage();
  }

  renderStage() {
    if (this.currentStageIndex >= NUMBER_CHAIN_STAGES.length) {
      this.finish();
      return;
    }

    const stage = NUMBER_CHAIN_STAGES[this.currentStageIndex];

    const titleEl = document.getElementById('calc-stage-title');
    const badgeEl = document.getElementById('calc-difficulty-badge');
    const counterEl = document.getElementById('calc-stage-counter');
    const descEl = document.getElementById('calc-desc');
    const givenEl = document.getElementById('calc-given-val');
    const formulaEl = document.getElementById('calc-formula-val');
    const stepsContainer = document.getElementById('calc-steps-container');
    const feedbackBox = document.getElementById('calc-feedback-box');
    const nextBtn = document.getElementById('btn-calc-next');
    const progressFill = document.getElementById('calc-progress-fill');

    if (titleEl) titleEl.textContent = stage.title;
    if (badgeEl) {
      badgeEl.textContent = stage.difficulty;
      badgeEl.className = `badge-diff badge-${stage.difficulty.toLowerCase()}`;
    }
    if (counterEl) counterEl.textContent = `Tahap ${stage.stage} / ${NUMBER_CHAIN_STAGES.length}`;
    if (descEl) descEl.textContent = stage.desc;
    if (givenEl) givenEl.textContent = stage.given;
    if (formulaEl) formulaEl.textContent = stage.formula;

    if (feedbackBox) {
      feedbackBox.style.display = 'none';
      feedbackBox.innerHTML = '';
    }
    if (nextBtn) nextBtn.style.display = 'none';

    if (progressFill) {
      const pct = ((this.currentStageIndex + 1) / NUMBER_CHAIN_STAGES.length) * 100;
      progressFill.style.width = `${pct}%`;
    }

    // Render input step(s)
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      stage.steps.forEach(step => {
        const stepRow = document.createElement('div');
        stepRow.className = 'calc-step-row';
        stepRow.id = `step-row-${step.id}`;
        stepRow.innerHTML = `
          <div class="calc-step-label">${step.label}</div>
          <div class="calc-input-wrap">
            <input 
              type="number" 
              step="any"
              id="input-${step.id}" 
              class="calc-number-input" 
              placeholder="Ketik angka..." 
              autocomplete="off"
            />
            <span class="calc-unit-tag">${step.unit}</span>
            <button type="button" class="btn-check-calc" id="btn-check-${step.id}">
              Cek Jawaban
            </button>
          </div>
          <div class="calc-step-status" id="status-${step.id}"></div>
        `;
        stepsContainer.appendChild(stepRow);

        const inputEl = stepRow.querySelector(`#input-${step.id}`);
        const checkBtn = stepRow.querySelector(`#btn-check-${step.id}`);

        checkBtn.addEventListener('click', () => {
          this.handleStepSubmit(stage, step, inputEl, checkBtn);
        });

        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.handleStepSubmit(stage, step, inputEl, checkBtn);
          }
        });
      });
    }

    this.startStageTimer();
  }

  startStageTimer() {
    if (this.timer) this.timer.stop();
    this.stageStartTime = Date.now();

    const timerNumEl = document.getElementById('calc-timer-num');

    // 60 seconds per calculation stage (90 seconds for Stage 5 multi-step)
    const duration = this.currentStageIndex === 4 ? 90 : 60;

    this.timer = new SyncTimer({
      durationSeconds: duration,
      onTick: (sec) => {
        if (timerNumEl) timerNumEl.textContent = `${sec}s`;
        if (sec <= 10) {
          sounds.tick();
          if (timerNumEl) timerNumEl.style.color = '#ef4444';
        } else {
          if (timerNumEl) timerNumEl.style.color = 'inherit';
        }
      },
      onComplete: () => {
        this.handleTimeout();
      }
    });

    this.timer.start();
  }

  async handleStepSubmit(stage, step, inputEl, checkBtn) {
    const rawVal = inputEl.value.trim();
    if (rawVal === '') {
      inputEl.focus();
      return;
    }

    const userVal = parseFloat(rawVal);
    if (isNaN(userVal)) {
      inputEl.focus();
      return;
    }

    const statusEl = document.getElementById(`status-${step.id}`);
    const timeSpent = Math.max(1, Math.round((Date.now() - this.stageStartTime) / 1000));

    // Tolerance allows small rounding differences
    const tolerance = 0.5;
    const isCorrect = Math.abs(userVal - step.target) <= tolerance;

    inputEl.disabled = true;
    checkBtn.disabled = true;

    if (isCorrect) {
      sounds.correct();
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#16a34a; font-weight:800;">✓ Benar! (+${step.weight} Pts)</span> — ${step.solution}`;
      }
      inputEl.style.borderColor = '#16a34a';
      inputEl.style.background = '#f0fdf4';
    } else {
      sounds.wrong();
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#dc2626; font-weight:800;">✗ Kurang Tepat (Target: ${step.target} ${step.unit})</span> — ${step.solution}`;
      }
      inputEl.style.borderColor = '#dc2626';
      inputEl.style.background = '#fef2f2';
    }

    // Submit answer to Firebase
    const session = gameState.session;
    const group = gameState.group;
    if (session && group) {
      try {
        const res = await callSubmitAnswer(
          session.id,
          group.groupNumber,
          group.deviceToken,
          'calc',
          stage.stage,
          userVal,
          isCorrect,
          step.weight,
          timeSpent,
          step.id
        );

        if (res && res.scores) {
          gameState.updateScores(res.scores);
          if (this.onUpdateScore) this.onUpdateScore(res.scores);
        } else if (isCorrect) {
          const newCalc = Math.min(35, Math.round(((gameState.scores.calc || 0) + step.weight) * 10) / 10);
          const newTotal = Math.min(100, Math.round(((gameState.scores.total || 0) + step.weight) * 10) / 10);
          gameState.updateScores({ calc: newCalc, total: newTotal });
          if (this.onUpdateScore) this.onUpdateScore(gameState.scores);
        }
      } catch (err) {
        console.error('[NumberChains] Error submitting step:', err);
      }
    }

    // Check if all steps in this stage are completed
    const allInputs = document.querySelectorAll('.calc-number-input');
    const allDone = Array.from(allInputs).every(inp => inp.disabled);

    if (allDone) {
      if (this.timer) this.timer.stop();
      this.showStageCompletion();
    }
  }

  handleTimeout() {
    sounds.wrong();
    const stage = NUMBER_CHAIN_STAGES[this.currentStageIndex];

    stage.steps.forEach(step => {
      const inputEl = document.getElementById(`input-${step.id}`);
      const checkBtn = document.getElementById(`btn-check-${step.id}`);
      const statusEl = document.getElementById(`status-${step.id}`);

      if (inputEl && !inputEl.disabled) {
        inputEl.disabled = true;
        if (checkBtn) checkBtn.disabled = true;
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#dc2626; font-weight:800;">⏰ Waktu Habis! (Target: ${step.target} ${step.unit})</span> — ${step.solution}`;
        }
      }
    });

    this.showStageCompletion();
  }

  showStageCompletion() {
    const feedbackBox = document.getElementById('calc-feedback-box');
    const nextBtn = document.getElementById('btn-calc-next');

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'feedback-box feedback-info';
      feedbackBox.innerHTML = `
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.25rem;">
          📊 Tahap ${this.currentStageIndex + 1} Selesai!
        </div>
        <div style="font-size:0.85rem;">Siap melanjutkan ke tahap berikutnya bersama kelompok kalian?</div>
      `;
    }

    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => {
        sounds.click();
        this.currentStageIndex++;
        this.renderStage();
      };
    }
  }

  async finish() {
    if (this.timer) this.timer.stop();
    sounds.stageComplete();
    gameState.markModeDone('calc');

    const session = gameState.session;
    const group = gameState.group;
    if (session && group) {
      await markModeCompleted(session.id, group.groupNumber, 'calc');
      await finishGroupGame(session.id, group.groupNumber);
    }

    if (this.onComplete) {
      this.onComplete({
        mode: 'calc',
        finalScore: gameState.scores.calc,
        totalScore: gameState.scores.total
      });
    }
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
