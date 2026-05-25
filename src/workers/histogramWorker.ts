/**
 * Web Worker for computing image histograms off-thread.
 * Mirrors the GLSL grading logic in TypeScript.
 */

interface GradingParams {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  shadows: { r: number; g: number; b: number };
  midtones: { r: number; g: number; b: number };
  highlights: { r: number; g: number; b: number };
  global: { r: number; g: number; b: number };
  curves: {
    master: Uint8Array;
    red: Uint8Array;
    green: Uint8Array;
    blue: Uint8Array;
  };
  hsl: {
    hue: Uint8Array;
    sat: Uint8Array;
    lum: Uint8Array;
  };
}

// Color Space Helpers
function rgb2hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

function hsv2rgb(h: number, s: number, v: number) {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r, g, b };
}

let baseImageData: Uint8ClampedArray | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'SET_IMAGE') {
    baseImageData = payload.imageData;
    return;
  }

  if (type === 'PROCESS') {
    const params: GradingParams = payload.params;
    if (!baseImageData || !params) return;

    const data = baseImageData;
    const len = data.length;
    
    const rHist = new Uint32Array(256);
    const gHist = new Uint32Array(256);
    const bHist = new Uint32Array(256);
    const lHist = new Uint32Array(256);

    // Constants from shaders
    const LUMA_WEIGHTS = { r: 0.2126, g: 0.7152, b: 0.0722 };

    for (let i = 0; i < len; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      // Exposure — EV-based, gamma space (matches WebGL shader)
      const evMult = Math.pow(2.0, params.exposure);
      r = Math.min(1.0, Math.max(0.0, r * evMult));
      g = Math.min(1.0, Math.max(0.0, g * evMult));
      b = Math.min(1.0, Math.max(0.0, b * evMult));

      // 1. Temperature & Tint
      r += params.temperature;
      b -= params.temperature;
      g += params.tint;

      // 2. Shadows (Lift)
      r = r + (params.shadows.r * (1.0 - r));
      g = g + (params.shadows.g * (1.0 - g));
      b = b + (params.shadows.b * (1.0 - b));

      // 3. Midtones (Gamma)
      r = Math.pow(Math.max(r, 0), 1.0 / Math.max(params.midtones.r, 0.01));
      g = Math.pow(Math.max(g, 0), 1.0 / Math.max(params.midtones.g, 0.01));
      b = Math.pow(Math.max(b, 0), 1.0 / Math.max(params.midtones.b, 0.01));

      // 4. Highlights (Gain)
      r *= params.highlights.r;
      g *= params.highlights.g;
      b *= params.highlights.b;

      // 5. Global (Offset)
      r += params.global.r;
      g += params.global.g;
      b += params.global.b;

      // 6. Contrast (0.5 pivot)
      r = (r - 0.5) * params.contrast + 0.5;
      g = (g - 0.5) * params.contrast + 0.5;
      b = (b - 0.5) * params.contrast + 0.5;

      // 7. Saturation
      const lumaValue = r * LUMA_WEIGHTS.r + g * LUMA_WEIGHTS.g + b * LUMA_WEIGHTS.b;
      r = lumaValue + (r - lumaValue) * params.saturation;
      g = lumaValue + (g - lumaValue) * params.saturation;
      b = lumaValue + (b - lumaValue) * params.saturation;

      // 8. Curves
      r = params.curves.red[Math.min(255, Math.max(0, Math.floor(r * 255)))] / 255;
      g = params.curves.green[Math.min(255, Math.max(0, Math.floor(g * 255)))] / 255;
      b = params.curves.blue[Math.min(255, Math.max(0, Math.floor(b * 255)))] / 255;

      r = params.curves.master[Math.min(255, Math.max(0, Math.floor(r * 255)))] / 255;
      g = params.curves.master[Math.min(255, Math.max(0, Math.floor(g * 255)))] / 255;
      b = params.curves.master[Math.min(255, Math.max(0, Math.floor(b * 255)))] / 255;

      // 9. HSL
      const hsv = rgb2hsv(r, g, b);
      const hIdx = Math.min(255, Math.max(0, Math.floor(hsv.h * 255)));
      
      const hShift = (params.hsl.hue[hIdx] / 255) * 2.0 - 1.0;
      const sShift = (params.hsl.sat[hIdx] / 255) * 2.0 - 1.0;
      const lShift = (params.hsl.lum[hIdx] / 255) * 2.0 - 1.0;

      hsv.h = (hsv.h + hShift * 0.15 + 1.0) % 1.0;
      hsv.s = Math.min(1.0, Math.max(0.0, hsv.s + sShift));
      hsv.v = Math.min(1.0, Math.max(0.0, hsv.v + lShift));

      const final = hsv2rgb(hsv.h, hsv.s, hsv.v);
      
      // Clamp and Bin
      const finalR = Math.min(255, Math.max(0, Math.floor(final.r * 255)));
      const finalG = Math.min(255, Math.max(0, Math.floor(final.g * 255)));
      const finalB = Math.min(255, Math.max(0, Math.floor(final.b * 255)));
      const finalL = Math.min(255, Math.max(0, Math.floor(final.r * 0.2126 + final.g * 0.7152 + final.b * 0.0722)));

      rHist[finalR]++;
      gHist[finalG]++;
      bHist[finalB]++;
      lHist[finalL]++;
    }

    self.postMessage({
      red: Array.from(rHist),
      green: Array.from(gHist),
      blue: Array.from(bHist),
      luma: Array.from(lHist),
    });
  }
};
