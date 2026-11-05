/**
 * THERMO CHAMPIONS: HEAT EDITION — SYNCHRONIZED TIMER UTILITY
 * Accurate drift-free timer supporting pause, resume, and server time sync.
 */

export class SyncTimer {
  /**
   * @param {Object} options
   * @param {number} options.durationSeconds
   * @param {function(number):void} options.onTick - Called every second with remaining seconds
   * @param {function():void} options.onComplete - Called when timer finishes
   */
  constructor({ durationSeconds, onTick, onComplete }) {
    this.duration = Math.max(1, Math.round(durationSeconds));
    this.remaining = this.duration;
    this.onTick = onTick || (() => {});
    this.onComplete = onComplete || (() => {});
    this.intervalId = null;
    this.startTime = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  start() {
    this.stop();
    this.remaining = this.duration;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.onTick(this.remaining);

    this.intervalId = setInterval(() => {
      if (this.isPaused) return;

      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const currentRemaining = Math.max(0, this.duration - elapsed);

      if (currentRemaining !== this.remaining) {
        this.remaining = currentRemaining;
        this.onTick(this.remaining);
      }

      if (this.remaining <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 250);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      // Adjust start time to prevent skipping
      this.startTime = Date.now() - ((this.duration - this.remaining) * 1000);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.isPaused = false;
  }

  getRemaining() {
    return this.remaining;
  }

  getElapsed() {
    return this.duration - this.remaining;
  }
}
