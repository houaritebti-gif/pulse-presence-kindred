/**
 * Connection and network detection utilities.
 */

export type ConnectionSpeed = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface NetworkInformation {
  effectiveType?: ConnectionSpeed;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, handler: () => void) => void;
  removeEventListener?: (type: string, handler: () => void) => void;
}

/**
 * Get the navigator connection object if available
 */
export function getNavigatorConnection(): NetworkInformation | undefined {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection;
}

/**
 * Detect the user's connection speed
 */
export function getConnectionSpeed(): ConnectionSpeed {
  const connection = getNavigatorConnection();
  if (connection?.effectiveType) {
    return connection.effectiveType;
  }
  return 'unknown';
}

/**
 * Check if user prefers reduced data usage
 */
export function prefersReducedData(): boolean {
  const connection = getNavigatorConnection();
  return connection?.saveData === true;
}

/**
 * Check if connection is slow (2G or worse)
 */
export function isSlowConnection(): boolean {
  const speed = getConnectionSpeed();
  return speed === 'slow-2g' || speed === '2g';
}
