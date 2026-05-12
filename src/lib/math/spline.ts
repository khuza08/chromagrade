export interface Point {
  x: number;
  y: number;
}

/**
 * Implements Monotone Cubic Spline Interpolation (Fritsch-Carlson)
 * This ensures that if points are monotonic, the resulting curve is also monotonic,
 * preventing the "overshoot" common in standard cubic splines.
 */
export function getMonotoneCubicSpline(points: Point[]): Float32Array {
  const lut = new Float32Array(256);
  
  // Sort points by x to be safe
  const p = [...points].sort((a, b) => a.x - b.x);
  const n = p.length;
  
  if (n < 2) {
    // Return linear identity if not enough points
    for (let i = 0; i < 256; i++) lut[i] = i / 255;
    return lut;
  }

  // 1. Calculate the secant slopes
  const m = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    m[i] = (p[i + 1].y - p[i].y) / (p[i + 1].x - p[i].x);
  }

  // 2. Calculate tangents at points (average of adjacent secants)
  const d = new Array(n);
  d[0] = m[0];
  for (let i = 1; i < n - 1; i++) {
    d[i] = (m[i - 1] + m[i]) / 2;
  }
  d[n - 1] = m[n - 2];

  // 3. Ensure monotonicity (Fritsch-Carlson)
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      d[i] = 0;
      d[i + 1] = 0;
    } else {
      const a = d[i] / m[i];
      const b = d[i + 1] / m[i];
      const h = Math.sqrt(a * a + b * b);
      if (h > 3) {
        const t = 3 / h;
        d[i] = t * a * m[i];
        d[i + 1] = t * b * m[i];
      }
    }
  }

  // 4. Interpolate 256 values
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    
    // Find segment
    let j = 0;
    while (j < n - 2 && x > p[j + 1].x) {
      j++;
    }

    const h = p[j + 1].x - p[j].x;
    const t = (x - p[j].x) / h;
    
    // Clamp t for safety
    const tC = Math.max(0, Math.min(1, t));
    
    // Hermite basis functions
    const h00 = 2 * tC * tC * tC - 3 * tC * tC + 1;
    const h10 = tC * tC * tC - 2 * tC * tC + tC;
    const h01 = -2 * tC * tC * tC + 3 * tC * tC;
    const h11 = tC * tC * tC - tC * tC;

    const val = h00 * p[j].y + h10 * h * d[j] + h01 * p[j + 1].y + h11 * h * d[j + 1];
    
    // Clamp to 0.0 - 1.0
    lut[i] = Math.max(0, Math.min(1, val));
  }

  return lut;
}
