// @ts-expect-error — no type declarations for exif-parser
import ExifParser from 'exif-parser';

function findLargestJpeg(buf: ArrayBuffer): Uint8Array | null {
  const view = new Uint8Array(buf);
  let best: Uint8Array | null = null;

  for (let i = 0; i < view.length - 1; i++) {
    if (view[i] === 0xff && view[i + 1] === 0xd8) {
      // Found SOI — scan forward for EOI
      for (let j = i + 2; j < view.length - 1; j++) {
        if (view[j] === 0xff && view[j + 1] === 0xd9) {
          const segment = view.slice(i, j + 2);
          if (!best || segment.length > best.length) best = segment;
          i = j + 1; // skip past this JPEG
          break;
        }
      }
    }
  }

  return best;
}

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to decode preview JPEG')); };
    img.src = url;
  });
}

export async function extractPreview(file: File): Promise<{ blob: Blob; previewWarning: string | null }> {
  const buffer = await file.arrayBuffer();

  // Read sensor dimensions from EXIF
  let sensorW = 0;
  let sensorH = 0;
  try {
    const result = ExifParser.create(buffer).parse();
    sensorW = result.tags.ExifImageWidth || result.tags.ImageWidth || 0;
    sensorH = result.tags.ExifImageHeight || result.tags.ImageHeight || 0;
  } catch {
    // EXIF unavailable — skip warning
  }

  const jpegBytes = findLargestJpeg(buffer);
  if (!jpegBytes) throw new Error('No embedded JPEG preview found in RAW file');

  const blob = new Blob([jpegBytes], { type: 'image/jpeg' });

  let previewWarning: string | null = null;
  if (sensorW > 0 && sensorH > 0) {
    const { width, height } = await getImageDimensions(blob);
    if (width < sensorW || height < sensorH) {
      previewWarning = 'Preview quality — full RAW decode not supported';
    }
  }

  return { blob, previewWarning };
}
