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
