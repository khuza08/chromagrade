export function computeAutoWB(imageData: ImageData): { temperature: number; tint: number } {
  const data = imageData.data;
  const len = data.length;

  // Step 1: compute luminance for every pixel, find 90th percentile threshold
  const luminances: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    luminances.push(lum);
  }
  luminances.sort((a, b) => a - b);
  const threshold = luminances[Math.floor(luminances.length * 0.9)];

  // Step 2: average only bright pixels
  let sumR = 0,
    sumG = 0,
    sumB = 0,
    count = 0;
  for (let i = 0; i < len; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (lum >= threshold) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count++;
    }
  }

  if (count === 0) return { temperature: 0, tint: 0 };

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const avgAll = (avgR + avgG + avgB) / 3;

  if (avgAll < 1) return { temperature: 0, tint: 0 };

  let temp = (-(avgB - avgR) / avgAll) * 50;
  let tint = -((avgG - (avgR + avgB) / 2) / avgAll) * 15; // reduced from 30 → 15

  temp = Math.max(-40, Math.min(40, temp));
  tint = Math.max(-10, Math.min(10, tint)); // tightened from ±20 → ±10

  return { temperature: Math.round(temp), tint: Math.round(tint) };
}
