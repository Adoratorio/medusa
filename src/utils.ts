// Counter for ensuring uniqueness
let medusaNodeCounter = 0;

/**
 * Crypto-based UUID
 */
export function uID(): string {
  medusaNodeCounter += 1;

  // Use native crypto UUID if available
  return `${crypto.randomUUID()}-${medusaNodeCounter}`;
}

/**
 * Get current counter value (useful for debugging)
 */
export function getUidCounter(): number {
  return medusaNodeCounter;
}

/**
 * Thresholds utility function
 */
export function thresholdsByPixels(): number[] {
  // Generate array of thresholds from 0 to 1 in small increments
  // Useful for pixel-based intersection detection
  const thresholds: number[] = [];
  for (let i = 0; i <= 100; i++) {
    thresholds.push(i / 100);
  }
  return thresholds;
}
