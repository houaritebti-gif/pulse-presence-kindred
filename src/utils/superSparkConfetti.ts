import confetti from "canvas-confetti";

/**
 * Fires an extraordinary confetti animation when sending a Super Chispa.
 * Uses electric blue, purple, and gold colors with lightning-like effects.
 */
export const fireSuperSparkConfetti = () => {
  // Super Spark colors: electric blue, purple, gold, pink
  const superSparkColors = ['#3B82F6', '#8B5CF6', '#A855F7', '#FFD700', '#EC4899', '#06B6D4'];
  
  // Initial lightning burst from center
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: superSparkColors,
    startVelocity: 50,
    gravity: 0.7,
    scalar: 1.6,
    shapes: ['circle', 'square'],
    ticks: 150,
  });
  
  // Electric bolts from sides
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 35,
      origin: { x: 0, y: 0.5 },
      colors: ['#3B82F6', '#8B5CF6', '#FFD700'],
      startVelocity: 55,
      gravity: 0.6,
      scalar: 1.4,
      drift: 1,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 35,
      origin: { x: 1, y: 0.5 },
      colors: ['#3B82F6', '#8B5CF6', '#FFD700'],
      startVelocity: 55,
      gravity: 0.6,
      scalar: 1.4,
      drift: -1,
    });
  }, 80);
  
  // Top sparkle shower
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 160,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#A855F7', '#3B82F6', '#EC4899'],
      startVelocity: 25,
      gravity: 1,
      scalar: 1.3,
      ticks: 120,
      drift: 0,
    });
  }, 150);
  
  // Secondary center burst (golden)
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FBBF24'],
      startVelocity: 40,
      gravity: 0.8,
      scalar: 1.5,
      ticks: 100,
    });
  }, 250);
  
  // Final electric shower from bottom
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 120,
      origin: { x: 0.5, y: 1 },
      colors: superSparkColors,
      startVelocity: 60,
      gravity: 0.5,
      scalar: 1.2,
      ticks: 100,
    });
  }, 350);
};

/**
 * Fires golden stars animation specifically for Super Chispa.
 * Distinct from regular Chispa hearts - uses stars and gold exclusively.
 */
export const fireSuperSparkGoldenStars = () => {
  // Pure gold and star colors
  const goldenColors = ['#FFD700', '#FFA500', '#FBBF24', '#F59E0B', '#EAB308', '#FCD34D'];
  
  // Initial star burst from upper area (swipe up direction)
  confetti({
    particleCount: 50,
    angle: 270,
    spread: 70,
    origin: { x: 0.5, y: 0.2 },
    colors: goldenColors,
    startVelocity: 40,
    gravity: 0.6,
    scalar: 1.6,
    shapes: ['star'],
    ticks: 100,
  });
  
  // Side star trails
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 45,
      spread: 40,
      origin: { x: 0.2, y: 0.3 },
      colors: goldenColors,
      startVelocity: 35,
      gravity: 0.7,
      scalar: 1.4,
      shapes: ['star'],
      drift: 0.5,
    });
    confetti({
      particleCount: 30,
      angle: 135,
      spread: 40,
      origin: { x: 0.8, y: 0.3 },
      colors: goldenColors,
      startVelocity: 35,
      gravity: 0.7,
      scalar: 1.4,
      shapes: ['star'],
      drift: -0.5,
    });
  }, 100);
  
  // Golden rain from top
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 160,
      origin: { x: 0.5, y: -0.1 },
      colors: ['#FFD700', '#FCD34D', '#FBBF24'],
      startVelocity: 15,
      gravity: 0.9,
      scalar: 1.3,
      shapes: ['star', 'circle'],
      ticks: 120,
      drift: 0.2,
    });
  }, 180);
  
  // Final center star explosion
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#FFD700', '#FFA500'],
      startVelocity: 30,
      gravity: 0.8,
      scalar: 1.8,
      shapes: ['star'],
      ticks: 80,
    });
  }, 280);
};

/**
 * Fires a receiving animation when someone receives a Super Chispa.
 * Gentler but still impressive effect.
 */
export const fireSuperSparkReceived = () => {
  const receivedColors = ['#FFD700', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4'];
  
  // Central glow burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: receivedColors,
    startVelocity: 35,
    gravity: 0.8,
    scalar: 1.4,
    ticks: 120,
  });
  
  // Star shimmer from top
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 140,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FFA500', '#A855F7'],
      startVelocity: 20,
      gravity: 1.1,
      scalar: 1.2,
      ticks: 100,
      drift: 0.3,
    });
  }, 150);
  
  // Soft side bursts
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 50,
      origin: { x: 0.1, y: 0.6 },
      colors: receivedColors,
      startVelocity: 30,
      gravity: 0.9,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 50,
      origin: { x: 0.9, y: 0.6 },
      colors: receivedColors,
      startVelocity: 30,
      gravity: 0.9,
    });
  }, 200);
};
