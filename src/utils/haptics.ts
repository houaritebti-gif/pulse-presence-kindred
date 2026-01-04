/**
 * Haptic feedback utilities for mobile devices
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  selection: 15,
  success: [10, 50, 30],
  warning: [30, 50, 30],
  error: [50, 100, 50, 100, 50],
};

/**
 * Triggers haptic feedback on supported devices
 * @param type - The type of haptic feedback
 */
export const triggerHaptic = (type: HapticType = 'light'): void => {
  // Check if vibration API is supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const pattern = vibrationPatterns[type];
    navigator.vibrate(pattern);
  }
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};
