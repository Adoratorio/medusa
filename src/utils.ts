export function thresholdsByPixels() : Array<number> {
  const arrayThresholds = [];

  for (let i = 0; i <= 1.0; i += 0.01) {
    arrayThresholds.push(i);
  }

  return arrayThresholds;
}

let medusaIndexNode = 0;

export function uid() {
  medusaIndexNode += 1;

  return Math.floor(Math.random() * Math.floor(Math.random() * Date.now())) + medusaIndexNode;
}
