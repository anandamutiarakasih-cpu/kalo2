/**
 * THERMO CHAMPIONS: HEAT EDITION — UI UTILITIES
 * Toast notifications, Modal controllers, and Canvas Confetti
 */

export function showToast(message, type = 'info', duration = 3000) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
      max-width: 90vw;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    info: '#2563eb',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '⚠️',
    warning: '🔔'
  };

  toast.style.cssText = `
    background: ${bgColors[type] || '#1e293b'};
    color: #ffffff;
    padding: 0.75rem 1.15rem;
    border-radius: 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
  `;

  toast.innerHTML = `<span>${icons[type] || '✨'}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  // Remove toast after duration
  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, duration);
}

export function launchConfetti(durationMs = 3500) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  const colors = ['#f97316', '#e11d48', '#2563eb', '#10b981', '#fbbf24', '#8b5cf6', '#06b6d4'];
  const confettiCount = 140;
  const particles = [];

  for (let i = 0; i < confettiCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.4 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.9) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.28,
      drag: 0.96,
      opacity: 1
    });
  }

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > durationMs) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (elapsed > durationMs - 1000) {
        p.opacity = Math.max(0, (durationMs - elapsed) / 1000);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
  }
}
