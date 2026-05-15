function buildThresholdsByPixels(): number[] {
  const result: number[] = [];
  for (let i = 0; i <= 100; i++) {
    result.push(i / 100);
  }
  return result;
}

export const THRESHOLDS_BY_PIXELS: number[] = buildThresholdsByPixels();
