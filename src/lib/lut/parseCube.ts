export class LutParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LutParseError';
  }
}

export interface ParsedCube {
  size: number;
  /** Float32Array of length size³ × 3, RGB interleaved, domain-normalized to [0,1]. */
  data: Float32Array;
}

export function parseCube(text: string): ParsedCube {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let size = 0;
  let domainMin = [0, 0, 0];
  let domainMax = [1, 1, 1];
  const dataLines: string[] = [];
  let is3D = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('LUT_3D_SIZE')) {
      size = parseInt(line.split(/\s+/)[1], 10);
      is3D = true;
    } else if (line.startsWith('LUT_1D_SIZE')) {
      throw new LutParseError('1D LUTs are not supported. Please use a 3D .cube file.');
    } else if (line.startsWith('DOMAIN_MIN')) {
      domainMin = line.split(/\s+/).slice(1).map(Number);
    } else if (line.startsWith('DOMAIN_MAX')) {
      domainMax = line.split(/\s+/).slice(1).map(Number);
    } else if (/^[A-Z_]/.test(line)) {
      // skip other header keywords
    } else {
      const parts = line.split(/\s+/);
      if (parts.length >= 3 && !isNaN(Number(parts[0]))) {
        dataLines.push(line);
      }
    }
  }

  if (!is3D) throw new LutParseError('LUT_3D_SIZE not found. Not a valid 3D .cube file.');
  if (size < 2 || size > 65) throw new LutParseError(`Invalid LUT size: ${size}. Expected 2–65.`);

  const expected = size * size * size;
  if (dataLines.length !== expected) {
    throw new LutParseError(`Expected ${expected} entries for ${size}³ LUT, found ${dataLines.length}.`);
  }

  const data = new Float32Array(expected * 3);
  for (let i = 0; i < expected; i++) {
    const parts = dataLines[i].split(/\s+/);
    for (let c = 0; c < 3; c++) {
      const raw = Number(parts[c]);
      const range = domainMax[c] - domainMin[c];
      data[i * 3 + c] = range === 0 ? 0 : (raw - domainMin[c]) / range;
    }
  }

  return { size, data };
}
