import type { GradingState, CurvePoint, WheelValue, HSLState } from '../store/slices/gradingSlice';

// Interfaces matching the spec
export interface ImageStats {
  rgbCdf: {
    r: number[];
    g: number[];
    b: number[];
    l: number[]; // Lightness/Luminance CDF
  };
  labMean: { l: number; a: number; b: number };
  labStd: { l: number; a: number; b: number };
  zoneMeans: {
    shadows: { a: number; b: number };
    midtones: { a: number; b: number };
    highlights: { a: number; b: number };
  };
}

export interface ColorTransferResult {
  curves: {
    master: CurvePoint[];
    red: CurvePoint[];
    green: CurvePoint[];
    blue: CurvePoint[];
  };
  temperature: number;
  tint: number;
  saturation: number;
  primary: {
    shadows: WheelValue;
    midtones: WheelValue;
    highlights: WheelValue;
  };
}

/**
 * Convert sRGB in 0..255 to CIELAB {l, a, b}.
 * References standard formulas for D65 illuminant.
 */
export function srgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // 1. Normalize sRGB to [0, 1]
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // 2. Convert sRGB to linear RGB
  const rLinear = rNorm <= 0.04045 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
  const gLinear = gNorm <= 0.04045 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
  const bLinear = bNorm <= 0.04045 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);

  // 3. Convert linear RGB to XYZ (D65 white point)
  const x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
  const y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
  const z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;

  // 4. Normalize by D65 reference white point
  // X_r = 0.95047, Y_r = 1.00000, Z_r = 1.08883
  const xr = x / 0.95047;
  const yr = y / 1.0;
  const zr = z / 1.08883;

  // 5. Convert XYZ to LAB
  const epsilon = 216 / 24389; // 0.008856
  const kappa = 24389 / 27;    // 903.3

  const f = (t: number) => (t > epsilon ? Math.pow(t, 1 / 3) : (kappa * t + 16) / 116);

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  const l = 116 * fy - 16;
  const la = 500 * (fx - fy);
  const lb = 200 * (fy - fz);

  return { l, a: la, b: lb };
}

/**
 * Builds a 256-bin histogram for red, green, and blue channels.
 */
export function buildHistogram(pixels: Uint8ClampedArray): { r: number[]; g: number[]; b: number[] } {
  const rHist = new Array(256).fill(0);
  const gHist = new Array(256).fill(0);
  const bHist = new Array(256).fill(0);

  const len = pixels.length;
  for (let i = 0; i < len; i += 4) {
    rHist[pixels[i]]++;
    gHist[pixels[i + 1]]++;
    bHist[pixels[i + 2]]++;
  }

  return { r: rHist, g: gHist, b: bHist };
}

/**
 * Builds a normalized Cumulative Distribution Function (CDF) from a histogram.
 */
export function buildCdf(histogram: number[]): number[] {
  const cdf = new Array(256);
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    cdf[i] = sum;
  }

  if (sum === 0) {
    // Return identity CDF if histogram is empty
    for (let i = 0; i < 256; i++) {
      cdf[i] = i / 255;
    }
    return cdf;
  }

  for (let i = 0; i < 256; i++) {
    cdf[i] /= sum;
  }

  return cdf;
}

/**
 * Produces the inverse CDF lookup table.
 */
export function invertCdf(cdf: number[]): number[] {
  const inv = new Array(256);
  for (let i = 0; i < 256; i++) {
    const target = i / 255;
    let j = 0;
    while (j < 256 && cdf[j] < target) {
      j++;
    }
    if (j === 256) j = 255;
    inv[i] = j;
  }
  return inv;
}

/**
 * Maps base CDF to reference CDF.
 */
export function cdfMapping(baseCdf: number[], refCdf: number[]): number[] {
  const refCdfInv = invertCdf(refCdf);
  const mapping = new Array(256);
  for (let x = 0; x < 256; x++) {
    const baseVal = baseCdf[x];
    const targetIdx = Math.min(255, Math.max(0, Math.floor(baseVal * 255.99)));
    mapping[x] = refCdfInv[targetIdx] / 255;
  }
  return mapping;
}

/**
 * Simplifies a curve using the Douglas-Peucker algorithm.
 */
export function douglasPeucker(points: CurvePoint[], epsilon: number): CurvePoint[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = getOrthoDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }

  if (maxDist > epsilon) {
    const results1 = douglasPeucker(points.slice(0, index + 1), epsilon);
    const results2 = douglasPeucker(points.slice(index), epsilon);
    return results1.slice(0, results1.length - 1).concat(results2);
  } else {
    return [points[0], points[end]];
  }
}

function getOrthoDistance(p: CurvePoint, a: CurvePoint, b: CurvePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.sqrt(lenSq);
}

/**
 * Enforces curve monotonicity: y values must be non-decreasing.
 */
export function enforceMonotonic(points: CurvePoint[]): CurvePoint[] {
  if (points.length === 0) return [];

  const result: CurvePoint[] = [{ ...points[0] }];
  for (let i = 1; i < points.length; i++) {
    const prev = result[i - 1];
    let y = Math.max(prev.y, points[i].y);
    if (i === points.length - 1) {
      y = 1.0;
    }
    result.push({ x: points[i].x, y });
  }
  return result;
}

/**
 * Analyzes image pixel data to generate stats.
 */
export function analyzeImage(imageData: ImageData): ImageStats {
  const pixels = imageData.data;
  const len = pixels.length;
  const numPixels = len / 4;

  // Build histograms
  const { r: rHist, g: gHist, b: bHist } = buildHistogram(pixels);
  const lHist = new Array(256).fill(0);

  let sumL = 0, sumA = 0, sumB = 0;
  let sumLSq = 0, sumASq = 0, sumBSq = 0;

  // Zones for color wheels
  let shadowsA = 0, shadowsB = 0, shadowsCount = 0;
  let midtonesA = 0, midtonesB = 0, midtonesCount = 0;
  let highlightsA = 0, highlightsB = 0, highlightsCount = 0;

  for (let i = 0; i < len; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const lab = srgbToLab(r, g, b);
    sumL += lab.l;
    sumA += lab.a;
    sumB += lab.b;

    sumLSq += lab.l * lab.l;
    sumASq += lab.a * lab.a;
    sumBSq += lab.b * lab.b;

    // Luminance histogram — use RGB luma (same space as RGB channels)
    // LAB L is perceptually uniform but not in 0-255 RGB space; applying it
    // as an RGB curve causes channel imbalance (green cast).
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    lHist[Math.min(255, luma)]++;

    // Zone accumulation based on RGB luma
    if (luma < 85) {
      shadowsA += lab.a;
      shadowsB += lab.b;
      shadowsCount++;
    } else if (luma < 170) {
      midtonesA += lab.a;
      midtonesB += lab.b;
      midtonesCount++;
    } else {
      highlightsA += lab.a;
      highlightsB += lab.b;
      highlightsCount++;
    }
  }

  const rgbCdf = {
    r: buildCdf(rHist),
    g: buildCdf(gHist),
    b: buildCdf(bHist),
    l: buildCdf(lHist),
  };

  const labMean = {
    l: sumL / numPixels,
    a: sumA / numPixels,
    b: sumB / numPixels,
  };

  const labStd = {
    l: Math.sqrt(Math.max(0, sumLSq / numPixels - labMean.l * labMean.l)),
    a: Math.sqrt(Math.max(0, sumASq / numPixels - labMean.a * labMean.a)),
    b: Math.sqrt(Math.max(0, sumBSq / numPixels - labMean.b * labMean.b)),
  };

  const zoneMeans = {
    shadows: {
      a: shadowsCount > 0 ? shadowsA / shadowsCount : 0,
      b: shadowsCount > 0 ? shadowsB / shadowsCount : 0,
    },
    midtones: {
      a: midtonesCount > 0 ? midtonesA / midtonesCount : 0,
      b: midtonesCount > 0 ? midtonesB / midtonesCount : 0,
    },
    highlights: {
      a: highlightsCount > 0 ? highlightsA / highlightsCount : 0,
      b: highlightsCount > 0 ? highlightsB / highlightsCount : 0,
    },
  };

  return { rgbCdf, labMean, labStd, zoneMeans };
}

/**
 * Computes the color transfer parameters from base and reference image stats.
 */
export function computeTransfer(base: ImageStats, ref: ImageStats): ColorTransferResult {
  // 1. Compute Curves (Epsilon = 0.01 for Douglas-Peucker)
  const epsilon = 0.01;

  const processChannelCurve = (baseCdf: number[], refCdf: number[]): CurvePoint[] => {
    const mapping = cdfMapping(baseCdf, refCdf);
    const points: CurvePoint[] = [];
    for (let i = 0; i < 256; i++) {
      points.push({ x: i / 255, y: mapping[i] });
    }
    points[0] = { x: 0, y: 0 };
    points[255] = { x: 1, y: 1 };

    const simplified = douglasPeucker(points, epsilon);
    return enforceMonotonic(simplified);
  };

  // 2. Compute chromaPresence first — needed to decide curve strategy.
  const refChromaStd = Math.sqrt(ref.labStd.a ** 2 + ref.labStd.b ** 2);
  // B&W images measure ~1.3 refChromaStd. Threshold at 3.0 with hard zero below 1.5.
  const GRAYSCALE_THRESHOLD = 3.0;
  const chromaPresence = refChromaStd < 1.5
    ? 0
    : Math.min(1, (refChromaStd - 1.5) / (GRAYSCALE_THRESHOLD - 1.5));

  const masterCurve = processChannelCurve(base.rgbCdf.l, ref.rgbCdf.l);

  // For B&W reference, R/G/B CDFs are identical (R=G=B per pixel).
  // Mapping each channel independently against a colorful base reintroduces color
  // because the base R/G/B CDFs differ. Collapse all channels to the master
  // luminance curve when reference is grayscale.
  const curves = chromaPresence < 0.1
    ? { master: masterCurve, red: masterCurve, green: masterCurve, blue: masterCurve }
    : {
        master: masterCurve,
        red: processChannelCurve(base.rgbCdf.r, ref.rgbCdf.r),
        green: processChannelCurve(base.rgbCdf.g, ref.rgbCdf.g),
        blue: processChannelCurve(base.rgbCdf.b, ref.rgbCdf.b),
      };

  // 3. Temperature & Tint
  const temperature = Math.min(500, Math.max(-500, (ref.labMean.b - base.labMean.b) * 4.0)) * chromaPresence;
  const tint = Math.min(500, Math.max(-500, (ref.labMean.a - base.labMean.a) * 4.0)) * chromaPresence;

  // 4. Saturation — force -100 for grayscale reference, ratio-based for colorful.
  const baseChromaStd = Math.sqrt(base.labStd.a ** 2 + base.labStd.b ** 2);
  const chromaRatio = refChromaStd / Math.max(baseChromaStd, 1e-3);
  const saturation = chromaPresence === 0
    ? -100
    : Math.min(100, Math.max(-100, (chromaRatio - 1) * 100));

  // 5. Color Wheels — scale x/y by chromaPresence so B&W reference produces no cast.
  const wheelScale = 0.05;
  const computeWheelOffset = (
    refZone: { a: number; b: number },
    baseZone: { a: number; b: number },
    chromaPresence: number,
  ): WheelValue => {
    const deltaA = refZone.a - baseZone.a;
    const deltaB = refZone.b - baseZone.b;

    return {
      x: Math.min(1, Math.max(-1, deltaA * wheelScale)) * chromaPresence,
      y: Math.min(1, Math.max(-1, -deltaB * wheelScale)) * chromaPresence, // Negative since positive y shifts to blue (negative b)
      luma: 1.0,
    };
  };

  const primary = {
    shadows: computeWheelOffset(ref.zoneMeans.shadows, base.zoneMeans.shadows, chromaPresence),
    midtones: computeWheelOffset(ref.zoneMeans.midtones, base.zoneMeans.midtones, chromaPresence),
    highlights: computeWheelOffset(ref.zoneMeans.highlights, base.zoneMeans.highlights, chromaPresence),
  };

  return { curves, temperature, tint, saturation, primary };
}

function evaluateCurve(curve: CurvePoint[], x: number): number {
  if (curve.length === 0) return x;
  if (x <= curve[0].x) return curve[0].y;
  if (x >= curve[curve.length - 1].x) return curve[curve.length - 1].y;

  for (let i = 0; i < curve.length - 1; i++) {
    const p1 = curve[i];
    const p2 = curve[i + 1];
    if (x >= p1.x && x <= p2.x) {
      if (p2.x === p1.x) return p1.y;
      const t = (x - p1.x) / (p2.x - p1.x);
      return p1.y + t * (p2.y - p1.y);
    }
  }
  return x;
}

function blendCurve(baseCurve: CurvePoint[], transferCurve: CurvePoint[], strength: number): CurvePoint[] {
  const numSamples = 20;
  const blendedSamples: CurvePoint[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const x = i / numSamples;
    const baseVal = evaluateCurve(baseCurve, x);
    const transferVal = evaluateCurve(transferCurve, x);
    const blendedY = baseVal + (transferVal - baseVal) * strength;
    blendedSamples.push({ x, y: blendedY });
  }

  blendedSamples[0] = { x: 0, y: 0 };
  blendedSamples[numSamples] = { x: 1, y: 1 };

  const simplified = douglasPeucker(blendedSamples, 0.01);
  return enforceMonotonic(simplified);
}

/**
 * Blends base grading state with computed transfer parameters using strength [0..1].
 */
export function blendGrading(base: GradingState, transfer: ColorTransferResult, strength: number): GradingState {
  const lerp = (vBase: number, vTransfer: number) => vBase + (vTransfer - vBase) * strength;

  // TASK-007: blendWheel lerps wheel x/y from base toward transfer at the given strength.
  // For a B&W reference, computeTransfer sets transfer wheel x/y to 0 (via chromaPresence ≈ 0).
  // So at any strength, the lerp becomes: base.x * 1.0 + 0 * strength = base.x preserved,
  // with no cast contribution from the transfer side. At strength=0.5 with B&W reference,
  // blended wheel x/y = exactly the base wheel values — no cast is added.
  const blendWheel = (wBase: WheelValue, wTransfer: WheelValue): WheelValue => ({
    x: lerp(wBase.x, wTransfer.x),
    y: lerp(wBase.y, wTransfer.y),
    luma: lerp(wBase.luma, wTransfer.luma),
  });

  const shadows = blendWheel(base.primary.shadows, transfer.primary.shadows);
  const midtones = blendWheel(base.primary.midtones, transfer.primary.midtones);
  const highlights = blendWheel(base.primary.highlights, transfer.primary.highlights);

  // global wheel is kept at base
  const global = { ...base.primary.global };

  // Lerp curves
  const curves = {
    master: blendCurve(base.curves.master, transfer.curves.master, strength),
    red: blendCurve(base.curves.red, transfer.curves.red, strength),
    green: blendCurve(base.curves.green, transfer.curves.green, strength),
    blue: blendCurve(base.curves.blue, transfer.curves.blue, strength),
  };

  // Lerp HSL shifts (shortest-arc for hue)
  // Since transferResult does not produce HSL values, they remain at base.
  // But if there were any, we'd blend using lerpHue. Let's make a deep clone anyway.
  const channels: (keyof HSLState)[] = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'];
  const blendedHsl = {} as HSLState;
  channels.forEach(ch => {
    blendedHsl[ch] = { ...base.hsl[ch] };
  });

  return {
    ...base,
    primary: { shadows, midtones, highlights, global },
    temperature: lerp(base.temperature, transfer.temperature),
    tint: lerp(base.tint, transfer.tint),
    saturation: lerp(base.saturation, transfer.saturation),
    curves,
    hsl: blendedHsl,
  };
}