export function thresholdsByPixels() : Array<number> {
  const arrayThresholds = [];

  for (let i = 0; i <= 1.0; i += 0.01) {
    arrayThresholds.push(i);
  }

  return arrayThresholds;
}

export function getOffsets(optionsOffsets : string) : Array<object> {
  const offsetsString = optionsOffsets || '0px';
  const offsets = offsetsString.split(/\s+/).map((offset) => {
    const parts = /^(-?\d*\.?\d+)(px|%)$/.exec(offset);

    if (!parts) throw new Error('rootMargin must be specified in pixels or percent');

    return { value: parseFloat(parts[1]), unit: parts[2] };
  });

  // Handles shorthand.
  offsets[1] = offsets[1] || offsets[0];
  offsets[2] = offsets[2] || offsets[0];
  offsets[3] = offsets[3] || offsets[1];

  return offsets;
}