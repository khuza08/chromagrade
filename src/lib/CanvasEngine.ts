import type { GradingState } from '../store/slices/gradingSlice';

export class CanvasEngine {
  private sourceCanvas: HTMLCanvasElement;
  private sourceCtx: CanvasRenderingContext2D;
  private targetCanvas: HTMLCanvasElement | null = null;
  private targetCtx: CanvasRenderingContext2D | null = null;
  private originalImageData: ImageData | null = null;

  constructor() {
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  public setTarget(canvas: HTMLCanvasElement) {
    this.targetCanvas = canvas;
    this.targetCtx = canvas.getContext('2d')!;
  }

  public async loadImage(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.sourceCanvas.width = img.width;
        this.sourceCanvas.height = img.height;
        this.sourceCtx.drawImage(img, 0, 0);
        this.originalImageData = this.sourceCtx.getImageData(0, 0, img.width, img.height);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  public render(params: GradingState) {
    if (!this.targetCtx || !this.originalImageData || !this.targetCanvas) return;

    const { width, height } = this.originalImageData;
    
    // Ensure target canvas matches source dimensions (or we can scale it)
    if (this.targetCanvas.width !== width || this.targetCanvas.height !== height) {
       this.targetCanvas.width = width;
       this.targetCanvas.height = height;
    }

    // Create a copy of the original data to process
    const outputData = new ImageData(new Uint8ClampedArray(this.originalImageData.data), width, height);
    const pixels = outputData.data;

    // --- Core Color Math (Phase 1 CPU implementation) ---
    // Note: This is simplified for Phase 1. WebGL in Phase 2.
    
    const contrast = (params.contrast + 100) / 100; // 0 to 2
    const saturation = (params.saturation + 100) / 100; // 0 to 2
    
    // Pre-calculate wheel values
    const lift = params.primary.lift;
    const gain = params.primary.gain;

    for (let i = 0; i < pixels.length; i += 4) {
      let r = pixels[i] / 255;
      let g = pixels[i + 1] / 255;
      let b = pixels[i + 2] / 255;

      // 1. Contrast
      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;

      // 2. Primary Wheels (Simplified Lift/Gamma/Gain)
      // Gain (Highlights)
      r *= (1 + gain.r / 100);
      g *= (1 + gain.g / 100);
      b *= (1 + gain.b / 100);

      // Lift (Shadows)
      r += (lift.r / 200);
      g += (lift.g / 200);
      b += (lift.b / 200);

      // 3. Saturation (Luma-based)
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = luma + (r - luma) * saturation;
      g = luma + (g - luma) * saturation;
      b = luma + (b - luma) * saturation;

      // Clamp and write back
      pixels[i] = Math.max(0, Math.min(255, r * 255));
      pixels[i + 1] = Math.max(0, Math.min(255, g * 255));
      pixels[i + 2] = Math.max(0, Math.min(255, b * 255));
    }

    this.targetCtx.putImageData(outputData, 0, 0);
  }
}

export const canvasEngine = new CanvasEngine();
