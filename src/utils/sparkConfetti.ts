import confetti from "canvas-confetti";

/**
 * Fires a celebratory confetti animation for mutual spark detection.
 * Uses fire/spark themed colors with multiple bursts for extra impact.
 */
export const fireSparkConfetti = () => {
  // Spark colors: warm oranges, pinks, and golds
  const sparkColors = ['#FF6B6B', '#FF8C42', '#FFD93D', '#FF69B4', '#FF1493', '#FFA500'];
  
  // First burst - center with flame shape
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.5, y: 0.5 },
    colors: sparkColors,
    startVelocity: 35,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ['circle', 'square'],
    ticks: 100,
  });
  
  // Second burst - left side spark
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 45,
      origin: { x: 0.1, y: 0.6 },
      colors: sparkColors,
      startVelocity: 30,
      gravity: 0.7,
    });
  }, 100);
  
  // Third burst - right side spark
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 45,
      origin: { x: 0.9, y: 0.6 },
      colors: sparkColors,
      startVelocity: 30,
      gravity: 0.7,
    });
  }, 150);
  
  // Final burst - center top with emoji-like particles
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
      colors: ['#FF6B6B', '#FFD93D', '#FF69B4'],
      startVelocity: 25,
      gravity: 1,
      scalar: 1.5,
      ticks: 80,
    });
  }, 250);
};

/**
 * Fires a celebratory confetti animation when user completes their photo gallery.
 * Uses camera/photo themed celebration with purple and pink colors.
 */
export const fireGalleryCompleteConfetti = () => {
  // Photo gallery colors: purples, pinks, and golds for achievement
  const galleryColors = ['#A855F7', '#EC4899', '#F472B6', '#C084FC', '#FFD700', '#FCD34D'];
  
  // Main celebration burst from bottom
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.9 },
    colors: galleryColors,
    startVelocity: 45,
    gravity: 0.9,
    scalar: 1.3,
    shapes: ['circle', 'square'],
    ticks: 120,
  });
  
  // Star-like bursts from sides
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: galleryColors,
      startVelocity: 40,
      gravity: 0.8,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: galleryColors,
      startVelocity: 40,
      gravity: 0.8,
    });
  }, 150);
  
  // Final golden rain from top
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FCD34D', '#F59E0B'],
      startVelocity: 20,
      gravity: 1.2,
      scalar: 1.1,
      ticks: 100,
      drift: 0,
    });
  }, 300);
};

/**
 * Fires a majestic confetti animation for epic achievements.
 * Uses royal purple and gold colors with dramatic bursts.
 */
export const fireEpicAchievementConfetti = () => {
  const epicColors = ['#A855F7', '#9333EA', '#7C3AED', '#C084FC', '#FFD700', '#FCD34D'];
  
  // Central burst with royal particles
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { x: 0.5, y: 0.5 },
    colors: epicColors,
    startVelocity: 40,
    gravity: 0.9,
    scalar: 1.4,
    shapes: ['circle', 'square'],
    ticks: 120,
  });
  
  // Side bursts with delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.6 },
      colors: epicColors,
      startVelocity: 35,
      gravity: 0.8,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.6 },
      colors: epicColors,
      startVelocity: 35,
      gravity: 0.8,
    });
  }, 150);
  
  // Golden shower from top
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 100,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FCD34D', '#A855F7'],
      startVelocity: 25,
      gravity: 1.1,
      scalar: 1.2,
      ticks: 100,
    });
  }, 300);
};

/**
 * Fires an extraordinary confetti animation for legendary achievements.
 * Maximum impact with rainbow gold colors and multiple waves.
 */
export const fireLegendaryAchievementConfetti = () => {
  const legendaryColors = ['#FFD700', '#FFA500', '#FF6B6B', '#A855F7', '#EC4899', '#3B82F6', '#10B981'];
  
  // Initial explosion from center
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: legendaryColors,
    startVelocity: 50,
    gravity: 0.8,
    scalar: 1.5,
    shapes: ['circle', 'square'],
    ticks: 150,
  });
  
  // Wave 1 - corners
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 45,
      spread: 40,
      origin: { x: 0, y: 1 },
      colors: legendaryColors,
      startVelocity: 45,
      gravity: 0.7,
    });
    confetti({
      particleCount: 40,
      angle: 135,
      spread: 40,
      origin: { x: 1, y: 1 },
      colors: legendaryColors,
      startVelocity: 45,
      gravity: 0.7,
    });
  }, 100);
  
  // Wave 2 - sides
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors: legendaryColors,
      startVelocity: 40,
      gravity: 0.8,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors: legendaryColors,
      startVelocity: 40,
      gravity: 0.8,
    });
  }, 200);
  
  // Wave 3 - top corners
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 315,
      spread: 45,
      origin: { x: 0, y: 0 },
      colors: legendaryColors,
      startVelocity: 35,
      gravity: 0.9,
    });
    confetti({
      particleCount: 50,
      angle: 225,
      spread: 45,
      origin: { x: 1, y: 0 },
      colors: legendaryColors,
      startVelocity: 35,
      gravity: 0.9,
    });
  }, 300);
  
  // Final golden rain
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 180,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FFA500', '#FBBF24'],
      startVelocity: 30,
      gravity: 1.2,
      scalar: 1.3,
      ticks: 120,
    });
  }, 400);
};
