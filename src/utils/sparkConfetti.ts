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

/**
 * Fires a welcoming confetti animation when a new user signs up.
 * Uses KIKI brand colors (pink, red) with heart-shaped celebration vibes.
 */
export const fireWelcomeConfetti = () => {
  // KIKI brand colors: pinks, reds, and warm accents
  const welcomeColors = ['#F6B1C3', '#E63946', '#FF69B4', '#FF1493', '#FFB6C1', '#FF85A2'];
  
  // Initial burst from bottom center - welcoming explosion
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: 0.5, y: 0.8 },
    colors: welcomeColors,
    startVelocity: 50,
    gravity: 0.9,
    scalar: 1.3,
    shapes: ['circle', 'square'],
    ticks: 130,
  });
  
  // Side bursts for extra celebration
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.7 },
      colors: welcomeColors,
      startVelocity: 40,
      gravity: 0.8,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.7 },
      colors: welcomeColors,
      startVelocity: 40,
      gravity: 0.8,
    });
  }, 150);
  
  // Gentle pink rain from top
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { x: 0.5, y: 0 },
      colors: ['#F6B1C3', '#FFB6C1', '#FF69B4'],
      startVelocity: 20,
      gravity: 1.1,
      scalar: 1.2,
      ticks: 100,
      drift: 0.5,
    });
  }, 300);
  
  // Final heart-colored burst
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#E63946', '#FF1493', '#F6B1C3'],
      startVelocity: 30,
      gravity: 1,
      scalar: 1.4,
      ticks: 90,
    });
  }, 450);
};

/**
 * Fires a magical confetti animation for perfect compatibility (5/5).
 * Uses hearts, stars, and rainbow sparkles for maximum impact.
 */
export const firePerfectCompatibilityConfetti = () => {
  // Perfect match colors: hearts (pink/red), stars (gold), magic (purple)
  const perfectColors = ['#FF69B4', '#FF1493', '#E91E63', '#FFD700', '#FFA500', '#A855F7', '#EC4899'];
  
  // Central heart-shaped burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: perfectColors,
    startVelocity: 40,
    gravity: 0.8,
    scalar: 1.4,
    shapes: ['circle'],
    ticks: 120,
  });
  
  // Stars from sides
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF69B4'],
      startVelocity: 35,
      gravity: 0.7,
      scalar: 1.2,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF69B4'],
      startVelocity: 35,
      gravity: 0.7,
      scalar: 1.2,
    });
  }, 100);
  
  // Sparkle rain from top
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 140,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#A855F7', '#EC4899', '#FF69B4'],
      startVelocity: 25,
      gravity: 1,
      scalar: 1.1,
      ticks: 100,
      drift: 0.3,
    });
  }, 200);
  
  // Final magical burst
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 100,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#A855F7', '#FFD700', '#FF1493'],
      startVelocity: 30,
      gravity: 0.9,
      scalar: 1.3,
      ticks: 90,
    });
  }, 350);
};

/**
 * Fires a special hearts animation for perfect compatibility match (5/5).
 * Uses pink and red hearts with romantic sparkles for maximum emotional impact.
 */
export const firePerfectMatchHearts = () => {
  // Heart colors: romantic pinks, reds, and rose gold
  const heartColors = ['#FF1493', '#FF69B4', '#E91E63', '#F06292', '#EC407A', '#D81B60', '#C2185B'];
  
  // Use heart-like shapes (circles work well for heart effect)
  const heartShapes: confetti.Shape[] = ['circle'];
  
  // Initial romantic burst from center
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { x: 0.5, y: 0.5 },
    colors: heartColors,
    startVelocity: 45,
    gravity: 0.6,
    scalar: 1.5,
    shapes: heartShapes,
    ticks: 150,
    drift: 0,
  });
  
  // Floating hearts from left
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 40,
      origin: { x: 0, y: 0.7 },
      colors: heartColors,
      startVelocity: 35,
      gravity: 0.5,
      scalar: 1.4,
      shapes: heartShapes,
      drift: 1,
    });
  }, 100);
  
  // Floating hearts from right
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 40,
      origin: { x: 1, y: 0.7 },
      colors: heartColors,
      startVelocity: 35,
      gravity: 0.5,
      scalar: 1.4,
      shapes: heartShapes,
      drift: -1,
    });
  }, 150);
  
  // Gentle heart rain from top
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 160,
      origin: { x: 0.5, y: -0.1 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493'],
      startVelocity: 15,
      gravity: 0.8,
      scalar: 1.6,
      shapes: heartShapes,
      ticks: 200,
      drift: 0.5,
    });
  }, 250);
  
  // Second wave of hearts from top
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 180,
      origin: { x: 0.5, y: -0.1 },
      colors: heartColors,
      startVelocity: 12,
      gravity: 0.7,
      scalar: 1.8,
      shapes: heartShapes,
      ticks: 220,
      drift: -0.3,
    });
  }, 400);
  
  // Final burst from center-bottom - the "explosion of love"
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { x: 0.5, y: 0.9 },
      colors: ['#FF1493', '#E91E63', '#FFD700', '#FF69B4'],
      startVelocity: 50,
      gravity: 0.9,
      scalar: 1.3,
      shapes: heartShapes,
      ticks: 130,
    });
  }, 550);
};

/**
 * Fires a subtle floating hearts micro-animation for regular Chispa swipes.
 * Lighter than perfect match hearts - just a quick celebratory burst.
 */
export const fireChispaHearts = () => {
  // Soft pink and coral colors for subtle celebration
  const chispaHeartColors = ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF85A2', '#F8BBD9'];
  
  // Subtle burst from right side (direction of swipe)
  confetti({
    particleCount: 25,
    angle: 120,
    spread: 50,
    origin: { x: 0.85, y: 0.5 },
    colors: chispaHeartColors,
    startVelocity: 25,
    gravity: 0.8,
    scalar: 1.1,
    shapes: ['circle'],
    ticks: 60,
    drift: -0.5,
  });
  
  // Secondary lighter burst
  setTimeout(() => {
    confetti({
      particleCount: 15,
      angle: 100,
      spread: 35,
      origin: { x: 0.7, y: 0.4 },
      colors: chispaHeartColors,
      startVelocity: 20,
      gravity: 0.9,
      scalar: 0.9,
      shapes: ['circle'],
      ticks: 50,
      drift: -0.3,
    });
  }, 80);
};

/**
 * Fires a simple confetti animation for common achievements.
 * Subtle celebration with soft colors.
 */
export const fireCommonAchievementConfetti = () => {
  const commonColors = ['#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9'];
  
  // Simple burst from bottom
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { x: 0.5, y: 0.7 },
    colors: commonColors,
    startVelocity: 30,
    gravity: 1,
    scalar: 1,
    shapes: ['circle', 'square'],
    ticks: 80,
  });
  
  // Light shimmer from top
  setTimeout(() => {
    confetti({
      particleCount: 25,
      spread: 80,
      origin: { x: 0.5, y: 0 },
      colors: commonColors,
      startVelocity: 15,
      gravity: 1.1,
      scalar: 0.9,
      ticks: 60,
    });
  }, 150);
};

/**
 * Fires a green-tinted confetti animation for uncommon achievements.
 * More noticeable than common with nature-inspired colors.
 */
export const fireUncommonAchievementConfetti = () => {
  const uncommonColors = ['#22C55E', '#4ADE80', '#86EFAC', '#10B981', '#34D399', '#6EE7B7'];
  
  // Main burst from center
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: uncommonColors,
    startVelocity: 35,
    gravity: 0.9,
    scalar: 1.1,
    shapes: ['circle', 'square'],
    ticks: 100,
  });
  
  // Side sparkles
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 45,
      origin: { x: 0.1, y: 0.6 },
      colors: uncommonColors,
      startVelocity: 28,
      gravity: 0.85,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 45,
      origin: { x: 0.9, y: 0.6 },
      colors: uncommonColors,
      startVelocity: 28,
      gravity: 0.85,
    });
  }, 100);
};

/**
 * Fires a blue-tinted confetti animation for rare achievements.
 * Distinctive burst with electric blue colors.
 */
export const fireRareAchievementConfetti = () => {
  const rareColors = ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8', '#DBEAFE'];
  
  // Central electric burst
  confetti({
    particleCount: 80,
    spread: 75,
    origin: { x: 0.5, y: 0.5 },
    colors: rareColors,
    startVelocity: 38,
    gravity: 0.85,
    scalar: 1.2,
    shapes: ['circle', 'square'],
    ticks: 110,
  });
  
  // Wave from sides
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 55,
      spread: 50,
      origin: { x: 0, y: 0.5 },
      colors: rareColors,
      startVelocity: 32,
      gravity: 0.8,
    });
    confetti({
      particleCount: 40,
      angle: 125,
      spread: 50,
      origin: { x: 1, y: 0.5 },
      colors: rareColors,
      startVelocity: 32,
      gravity: 0.8,
    });
  }, 120);
  
  // Final shimmer from top
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0 },
      colors: ['#93C5FD', '#DBEAFE', '#3B82F6'],
      startVelocity: 20,
      gravity: 1,
      scalar: 1.1,
      ticks: 80,
    });
  }, 220);
};

/**
 * Fires an energetic confetti animation for KIKI Now boost activation.
 * Uses electric/rocket themed colors with upward bursts for boost energy.
 */
export const fireKikiNowBoostConfetti = () => {
  // Boost colors: electric yellows, oranges, and energetic pinks
  const boostColors = ['#FFD700', '#FFA500', '#FF6B35', '#FF4500', '#FF1493', '#00D4FF', '#7C3AED'];
  
  // Initial rocket burst from bottom
  confetti({
    particleCount: 100,
    spread: 60,
    origin: { x: 0.5, y: 0.9 },
    colors: boostColors,
    startVelocity: 55,
    gravity: 0.8,
    scalar: 1.3,
    shapes: ['circle', 'square'],
    ticks: 120,
  });
  
  // Side energy bursts
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 50,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#00D4FF'],
      startVelocity: 40,
      gravity: 0.7,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 50,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#00D4FF'],
      startVelocity: 40,
      gravity: 0.7,
    });
  }, 100);
  
  // Electric sparks from center
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#00D4FF', '#7C3AED', '#FFD700'],
      startVelocity: 35,
      gravity: 0.9,
      scalar: 1.4,
      ticks: 100,
    });
  }, 200);
  
  // Final golden shower from top
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 140,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FFA500', '#FF6B35'],
      startVelocity: 25,
      gravity: 1.1,
      scalar: 1.2,
      ticks: 100,
    });
  }, 350);
};
