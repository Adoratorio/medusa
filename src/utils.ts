// Counter for ensuring uniqueness
let medusaNodeCounter = 0;

/**
 * Generates a unique ID string using timestamp, random values, and counter
 */
function uIDFallback(): string {
  medusaNodeCounter += 1;

  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 0x7FFFFFFF); // 31-bit random
  const random2 = Math.floor(Math.random() * 0x7FFFFFFF); // 31-bit random

  // Combine all components to ensure uniqueness
  return `${timestamp}-${random1}-${random2}-${medusaNodeCounter}`;
}

/**
 * Crypto-based UUID
 */
export function uID(): string {
  medusaNodeCounter += 1;

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use native crypto UUID if available
    return `${crypto.randomUUID()}-${medusaNodeCounter}`;
  }

  // Fallback to custom implementation
  return uIDFallback();
}

/**
 * Reset counter (useful for testing)
 */
export function resetUidCounter(): void {
  medusaNodeCounter = 0;
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
