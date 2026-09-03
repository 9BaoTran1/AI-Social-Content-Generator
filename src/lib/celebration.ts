import confetti from 'canvas-confetti';

/**
 * Gentle, tasteful celebratory particle burst (gold, violet, indigo, rose)
 */
export function triggerCelebration(): void {
  try {
    const count = 50;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 45,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.1,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 35,
    });
  } catch {
    // Gracefully ignore if canvas is unavailable
  }
}

/**
 * Micro sparkle burst right at the copy action
 */
export function triggerCopySparkle(event?: { clientX: number; clientY: number }): void {
  try {
    let x = 0.5;
    let y = 0.5;

    if (event && typeof window !== 'undefined') {
      x = event.clientX / window.innerWidth;
      y = event.clientY / window.innerHeight;
    }

    confetti({
      particleCount: 24,
      spread: 50,
      startVelocity: 20,
      origin: { x, y },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
      ticks: 120,
      gravity: 0.9,
      scalar: 0.7,
      disableForReducedMotion: true,
    });
  } catch {
    // Gracefully ignore
  }
}
