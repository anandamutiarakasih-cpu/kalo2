/**
 * THERMO CHAMPIONS: HEAT EDITION — MODE 1: STARCHAMP CHALLENGE
 * 10 Soal Pilihan Ganda Cepat — Maksimal 35 Poin (3,5 poin/soal)
 */

import { QUIZ_QUESTIONS } from "../../data/questions.js";
import { sounds } from "../utils/sounds.js";
import { SyncTimer } from "../utils/timer.js";
import { gameState } from "./state.js";
import { callSubmitAnswer } from "../firebase/functions.js";
import { markModeCompleted } from "../firebase/database.js";

export class StarChampGame {
  constructor({ onComplete, onUpdateScore }) {
    this.onComplete = onComplete;
    this.onUpdateScore = onUpdateScore;
    this.currentIndex = 0;
    this.timer = null;
    this.questionStartTime = 0;
    this.hasAnswered = false;
  }

  init() {
    this.currentIndex = 0;
    this.renderQuestion();
  }

  renderQuestion() {
    if (this.currentIndex >= QUIZ_QUESTIONS.length) {
      this.finish();
      return;
    }

    this.hasAnswered = false;
    const q = QUIZ_QUESTIONS[this.currentIndex];

    // DOM Elements matching index.html
    const topicEl = document.getElementById('quiz-topic-badge');
    const counterEl = document.getElementById('quiz-counter');
    const textEl = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('btn-quiz-next');
    const progressFill = document.getElementById('quiz-progress-fill');

    if (topicEl) topicEl.textContent = q.topic;
    if (counterEl) counterEl.textContent = `Soal ${this.currentIndex + 1} / ${QUIZ_QUESTIONS.length}`;
    if (textEl) textEl.textContent = q.question;
    if (feedbackBox) {
      feedbackBox.style.display = 'none';
      feedbackBox.innerHTML = '';
    }
    if (nextBtn) nextBtn.style.display = 'none';

    if (progressFill) {
      const pct = ((this.currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;
      progressFill.style.width = `${pct}%`;
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt-card';
        btn.dataset.key = opt.key;
        btn.innerHTML = `
          <div class="opt-key">${opt.key}</div>
          <div class="opt-text">${opt.text}</div>
        `;
        btn.addEventListener('click', () => this.handleAnswer(opt.key, btn));
        optionsContainer.appendChild(btn);
      });
    }

    // Start 30-second timer
    this.startTimer();
  }

  startTimer() {
    if (this.timer) this.timer.stop();
    this.questionStartTime = Date.now();

    const timerNumEl = document.getElementById('quiz-timer-num');

    this.timer = new SyncTimer({
      durationSeconds: 30,
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

  async handleAnswer(selectedKey, clickedBtn) {
    if (this.hasAnswered) return;
    this.hasAnswered = true;

    if (this.timer) this.timer.stop();
    const timeSpent = Math.max(1, Math.round((Date.now() - this.questionStartTime) / 1000));

    const q = QUIZ_QUESTIONS[this.currentIndex];
    const isCorrect = (selectedKey === q.correctAnswer);
    const scoreWeight = 3.5;

    // Visual feedback on options
    const optionsContainer = document.getElementById('quiz-options-container');
    if (optionsContainer) {
      const allBtns = optionsContainer.querySelectorAll('.opt-card');
      allBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        if (btn.dataset.key === q.correctAnswer) {
          btn.classList.add('opt-correct');
        } else if (btn.dataset.key === selectedKey && !isCorrect) {
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
          'quiz',
          q.id,
          selectedKey,
          isCorrect,
          scoreWeight,
          timeSpent
        );

        if (res && res.scores) {
          gameState.updateScores(res.scores);
          if (this.onUpdateScore) this.onUpdateScore(res.scores);
        } else if (isCorrect) {
          // Direct local increment fallback
          const newQuiz = Math.min(35, Math.round(((gameState.scores.quiz || 0) + scoreWeight) * 10) / 10);
          const newTotal = Math.min(100, Math.round(((gameState.scores.total || 0) + scoreWeight) * 10) / 10);
          gameState.updateScores({ quiz: newQuiz, total: newTotal });
          if (this.onUpdateScore) this.onUpdateScore(gameState.scores);
        }
      } catch (err) {
        console.error('[StarChamp] Error submitting answer:', err);
      }
    }

    // Display Explanation
    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = isCorrect ? 'feedback-box feedback-correct' : 'feedback-box feedback-wrong';
      feedbackBox.innerHTML = `
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.25rem;">
          ${isCorrect ? '🎉 JAWABAN BENAR! (+3.5 Poin)' : `❌ JAWABAN KURANG TEPAT (Kunci: ${q.correctAnswer})`}
        </div>
        <div style="font-size:0.85rem; line-height:1.4;">${q.explanation}</div>
      `;
    }

    // Show Next Button
    const nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => {
        sounds.click();
        this.currentIndex++;
        this.renderQuestion();
      };
    }
  }

  handleTimeout() {
    this.hasAnswered = true;
    sounds.wrong();

    const q = QUIZ_QUESTIONS[this.currentIndex];

    // Highlight correct answer
    const optionsContainer = document.getElementById('quiz-options-container');
    if (optionsContainer) {
      const allBtns = optionsContainer.querySelectorAll('.opt-card');
      allBtns.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.key === q.correctAnswer) {
          btn.classList.add('opt-correct');
        }
      });
    }

    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'feedback-box feedback-wrong';
      feedbackBox.innerHTML = `
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.25rem;">
          ⏰ WAKTU HABIS! (+0 Poin)
        </div>
        <div style="font-size:0.85rem; line-height:1.4;">Jawaban yang benar adalah <strong>${q.correctAnswer}</strong>. ${q.explanation}</div>
      `;
    }

    const nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => {
        sounds.click();
        this.currentIndex++;
        this.renderQuestion();
      };
    }
  }

  async finish() {
    if (this.timer) this.timer.stop();
    sounds.stageComplete();
    gameState.markModeDone('quiz');

    const session = gameState.session;
    const group = gameState.group;
    if (session && group) {
      await markModeCompleted(session.id, group.groupNumber, 'quiz');
    }

    if (this.onComplete) {
      this.onComplete({
        mode: 'quiz',
        finalScore: gameState.scores.quiz
      });
    }
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
