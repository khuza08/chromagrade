/**
 * HSL Target Tool Utilities
 * Handles color space conversion and hue-to-bin mapping with linear weighting.
 */

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

/**
 * Converts RGB [0-255] to HSL [0-360, 0-1, 0-1]
 * Handles the achromatic case (r=g=b) safely.
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Predefined Hue Bins matching Lightroom's 8 color regions.
 * Each bin represents a target hue degree.
 */
export const HUE_BINS = [
  { id: 'red',     hue: 0 },
  { id: 'orange',  hue: 30 },
  { id: 'yellow',  hue: 60 },
  { id: 'green',   hue: 120 },
  { id: 'aqua',    hue: 180 },
  { id: 'blue',    hue: 240 },
  { id: 'purple',  hue: 280 },
  { id: 'magenta', hue: 320 },
  { id: 'red_wrap',hue: 360 }, // Boundary case for wrapping
];

export interface HueWeight {
  bin: string;
  weight: number;
}

/**
 * Maps a hue degree [0-360] to the two nearest color bins.
 * Returns an array of weights summing to 1.0.
 */
export function mapHueToBins(hueDeg: number): HueWeight[] {
  // Normalize hue
  const h = (hueDeg + 360) % 360;

  // Find the two bins that surround the hue
  let lowerIdx = 0;
  for (let i = 0; i < HUE_BINS.length - 1; i++) {
    if (h >= HUE_BINS[i].hue && h < HUE_BINS[i + 1].hue) {
      lowerIdx = i;
      break;
    }
  }

  const lower = HUE_BINS[lowerIdx];
  const upper = HUE_BINS[lowerIdx + 1];

  const range = upper.hue - lower.hue;
  const dist = h - lower.hue;
  const upperWeight = dist / range;
  const lowerWeight = 1 - upperWeight;

  const result: HueWeight[] = [
    { bin: lower.id === 'red_wrap' ? 'red' : lower.id, weight: lowerWeight },
    { bin: upper.id === 'red_wrap' ? 'red' : upper.id, weight: upperWeight },
  ];

  // Filter out zero-weight bins
  return result.filter(r => r.weight > 0.001);
}
