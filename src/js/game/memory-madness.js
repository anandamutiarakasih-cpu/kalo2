/**
 * THERMO CHAMPIONS: HEAT EDITION — MODE 2: MEMORY MADNESS
 * Fase 1: Hafalkan 10 Kartu Fakta Kalor (30 detik)
 * Fase 2: 10 Soal Uji Ingatan Cepat Recall (25 detik/soal, 3 poin/soal = Maks 30 Poin)
 */

import { MEMORY_CARDS, RECALL_QUESTIONS } from "../../data/questions.js";
import { sounds } from "../utils/sounds.js";
import { SyncTimer } from "../utils/timer.js";
import { gameState } from "./state.js";
import { callSubmitAnswer } from "../firebase/functions.js";
import { markModeCompleted } from "../firebase/database.js";

export class MemoryMadnessGame {
  constructor({ onComplete, onUpdateScore }) {
    this.onComplete = onComplete;
    this.onUpdateScore = onUpdateScore;
    this.phase = 'memorize'; // 'memorize' | 'recall'
    this.currentIndex = 0;
    this.timer = null;
    this.questionStartTime = 0;
    this.hasAnswered = false;
  }

  init() {
    this.phase = 'memorize';
    this.currentIndex = 0;
    this.startMemorizationPhase();
  }

  startMemorizationPhase() {
    this.phase = 'memorize';

    const memoSection = document.getElementById('memory-phase-memo');
    const recallSection = document.getElementById('memory-phase-recall');
    const cardsGrid = document.getElementById('memory-cards-grid');
    const memoTimerEl = document.getElementById('memo-timer-num');

    if (memoSection) memoSection.style.display = 'block';
    if (recallSection) recallSection.style.display = 'none';

    // Render 10 memory cards
    if (cardsGrid) {
      cardsGrid.innerHTML = '';
      MEMORY_CARDS.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'memo-card';
        cardEl.innerHTML = `
          <div class="memo-card-cat">${card.cat}</div>
          <div class="memo-card-title">${card.title}</div>
          <div class="memo-card-fact">${card.fact}</div>
          <div class="memo-card-desc">${card.desc}</div>
        `;
        cardsGrid.appendChild(cardEl);
      });
    }

    // 30 Seconds Memorization Countdown
    if (this.timer) this.timer.stop();
    this.timer = new SyncTimer({
      durationSeconds: 30,
      onTick: (sec) => {
        if (memoTimerEl) memoTimerEl.textContent = `${sec}s`;
        if (sec <= 5) {
          sounds.tick();
          if (memoTimerEl) memoTimerEl.style.color = '#ef4444';
        } else {
          if (memoTimerEl) memoTimerEl.style.color = 'inherit';
        }
      },
      onComplete: () => {
        sounds.fanfare();
        this.startRecallPhase();
      }
    });

    this.timer.start();

    // Early skip button for memorization if group is ready
    const btnSkipMemo = document.getElementById('btn-skip-memo');
    if (btnSkipMemo) {
      btnSkipMemo.onclick = () => {
        sounds.click();
        if (this.timer) this.timer.stop();
        this.startRecallPhase();
      };
    }
  }

  startRecallPhase() {
    this.phase = 'recall';
    this.currentIndex = 0;

    const memoSection = document.getElementById('memory-phase-memo');
    const recallSection = document.getElementById('memory-phase-recall');

    if (memoSection) memoSection.style.display = 'none';
    if (recallSection) recallSection.style.display = 'block';

    this.renderRecallQuestion();
  }

  renderRecallQuestion() {
    if (this.currentIndex >= RECALL_QUESTIONS.length) {
      this.finish();
      return;
    }

    this.hasAnswered = false;
    const q = RECALL_QUESTIONS[this.currentIndex];

    const counterEl = document.getElementById('recall-counter');
    const textEl = document.getElementById('recall-question-text');
    const optionsContainer = document.getElementById('recall-options-container');
    const feedbackBox = document.getElementById('recall-feedback-box');
    const nextBtn = document.getElementById('btn-recall-next');
    const progressFill = document.getElementById('recall-progress-fill');

    if (counterEl) counterEl.textContent = `Tantangan ${this.currentIndex + 1} / ${RECALL_QUESTIONS.length}`;
    if (textEl) textEl.textContent = q.prompt;
    if (feedbackBox) {
      feedbackBox.style.display = 'none';
      feedbackBox.innerHTML = '';
    }
    if (nextBtn) nextBtn.style.display = 'none';

    if (progressFill) {
      const pct = ((this.currentIndex + 1) / RECALL_QUESTIONS.length) * 100;
      progressFill.style.width = `${pct}%`;
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt-card';
        btn.dataset.answer = optText;
        const letter = String.fromCharCode(65 + idx);
        btn.innerHTML = `
          <div class="opt-key">${letter}</div>
          <div class="opt-text">${optText}</div>
        `;
        btn.addEventListener('click', () => this.handleAnswer(optText, btn));
        optionsContainer.appendChild(btn);
      });
    }

    // 25 Seconds timer per recall question
    this.startRecallTimer();
  }

  startRecallTimer() {
    if (this.timer) this.timer.stop();
    this.questionStartTime = Date.now();

    const timerNumEl = document.getElementById('recall-timer-num');

    this.timer = new SyncTimer({
      durationSeconds: 25,
      onTick: (sec) => {
        if (timerNumEl) timerNumEl.textContent = `${sec}s`;
        if (sec <= 5) {
          sounds.tick();
          if (timerNumEl) timerNumEl.style.color = '#ef4444';
        } else {
          if (timerNumEl) timerNumEl.style.color = 'inherit';
        }
      },
      onComplete: () => {
        if (!this.hasAnswered) {
          this.handleTimeout();
        }
      }
    });

    this.timer.start();
  }

  async handleAnswer(selectedAnswer, clickedBtn) {
    if (this.hasAnswered) return;
    this.hasAnswered = true;

    if (this.timer) this.timer.stop();
    const timeSpent = Math.max(1, Math.round((Date.now() - this.questionStartTime) / 1000));

    const q = RECALL_QUESTIONS[this.currentIndex];
    const isCorrect = (selectedAnswer.trim() === q.answer.trim());
    const scoreWeight = 3.0;

    const optionsContainer = document.getElementById('recall-options-container');
    if (optionsContainer) {
      const allBtns = optionsContainer.querySelectorAll('.opt-card');
      allBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        if (btn.dataset.answer === q.answer) {
          btn.classList.add('opt-correct');
        } else if (btn.dataset.answer === selectedAnswer && !isCorrect) {
          btn.classList.add('opt-wrong');
        }
      });
    }

    if (isCorrect) {
      sounds.correct();
    } else {
      sounds.wrong();
    }

    // Submit answer to Firebase backend
    const session = gameState.session;
    const group = gameState.group;

    if (session && group) {
      try {
        const res = await callSubmitAnswer(
          session.id,
          group.groupNumber,
          group.deviceToken,
          'memory',
          q.id,
          selectedAnswer,
          isCorrect,
          scoreWeight,
          timeSpent
        );

        if (res && res.scores) {
          gameState.updateScores(res.scores);
          if (this.onUpdateScore) this.onUpdateScore(res.scores);
        } else if (isCorrect) {
          const newMem = Math.min(30, Math.round(((gameState.scores.memory || 0) + scoreWeight) * 10) / 10);
          const newTotal = Math.min(100, Math.round(((gameState.scores.total || 0) + scoreWeight) * 10) / 10);
          gameState.updateScores({ memory: newMem, total: newTotal });
          if (this.onUpdateScore) this.onUpdateScore(gameState.scores);
        }
      } catch (err) {
        console.error('[MemoryMadness] Error submitting answer:', err);
      }
    }

    const feedbackBox = document.getElementById('recall-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = isCorrect ? 'feedback-box feedback-correct' : 'feedback-box feedback-wrong';
      feedbackBox.innerHTML = `
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.25rem;">
          ${isCorrect ? '🎯 TEPAT SEKALI! (+3 Poin)' : `❌ KURANG TEPAT (Kunci: ${q.answer})`}
        </div>
        <div style="font-size:0.85rem; line-height:1.4;">${q.exp}</div>
      `;
    }

    const nextBtn = document.getElementById('btn-recall-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => {
        sounds.click();
        this.currentIndex++;
        this.renderRecallQuestion();
      };
    }
  }

  handleTimeout() {
    this.hasAnswered = true;
    sounds.wrong();

    const q = RECALL_QUESTIONS[this.currentIndex];

    const optionsContainer = document.getElementById('recall-options-container');
    if (optionsContainer) {
      const allBtns = optionsContainer.querySelectorAll('.opt-card');
      allBtns.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === q.answer) {
          btn.classList.add('opt-correct');
        }
      });
    }

    const feedbackBox = document.getElementById('recall-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'feedback-box feedback-wrong';
      feedbackBox.innerHTML = `
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.25rem;">
          ⏰ WAKTU HABIS! (+0 Poin)
        </div>
        <div style="font-size:0.85rem; line-height:1.4;">Jawaban yang benar adalah <strong>${q.answer}</strong>. ${q.exp}</div>
      `;
    }

    const nextBtn = document.getElementById('btn-recall-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => {
        sounds.click();
        this.currentIndex++;
        this.renderRecallQuestion();
      };
    }
  }

  async finish() {
    if (this.timer) this.timer.stop();
    sounds.stageComplete();
    gameState.markModeDone('memory');

    const session = gameState.session;
    const group = gameState.group;
    if (session && group) {
      await markModeCompleted(session.id, group.groupNumber, 'memory');
    }

    if (this.onComplete) {
      this.onComplete({
        mode: 'memory',
        finalScore: gameState.scores.memory
      });
    }
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
