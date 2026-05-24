export function computeAutoWB(imageData: ImageData): {
  temperature: number;
  tint: number;
} {
  const data = imageData.data;
  const len = data.length;
  const pixelCount = len / 4;

  let sumR = 0,
    sumG = 0,
    sumB = 0;
  for (let i = 0; i < len; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const avgAll = (avgR + avgG + avgB) / 3;

  console.log("INSIDE computeAutoWB", { avgR, avgG, avgB, avgAll });

  if (avgAll < 1) return { temperature: 0, tint: 0 };

  const rawTemp = ((avgB - avgR) / avgAll) * 150;
  const rawTint = ((avgG - (avgR + avgB) / 2) / avgAll) * 100;

  console.log("RAW BEFORE CLAMP", { rawTemp, rawTint });

  const temp = Math.max(-60, Math.min(60, rawTemp));
  const tint = Math.max(-15, Math.min(15, rawTint));

  return { temperature: Math.round(temp), tint: Math.round(tint) };
}
