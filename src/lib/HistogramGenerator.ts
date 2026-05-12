export interface HistogramData {
  master: number[];
  red: number[];
  green: number[];
  blue: number[];
  max: number;
}

export class HistogramGenerator {
  private offscreen: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = 256;
    this.offscreen.height = 256;
    this.ctx = this.offscreen.getContext('2d', { willReadFrequently: true })!;
  }

  public generate(sourceCanvas: HTMLCanvasElement): HistogramData {
    // 1. Downsample for performance
    this.ctx.drawImage(sourceCanvas, 0, 0, 256, 256);
    const imageData = this.ctx.getImageData(0, 0, 256, 256).data;

    const red = new Array(256).fill(0);
    const green = new Array(256).fill(0);
    const blue = new Array(256).fill(0);
    const master = new Array(256).fill(0);

    let max = 0;

    // 2. Count bins
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      
      // Luma (Rec. 709)
      const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      red[r]++;
      green[g]++;
      blue[b]++;
      master[y]++;
      
      // Update local max for normalization later
      max = Math.max(max, red[r], green[g], blue[b], master[y]);
    }

    return { master, red, green, blue, max };
  }
}

export const histogramGenerator = new HistogramGenerator();
