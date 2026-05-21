import type { GradingState, WheelValue, CurvesState, HSLState } from '../store/slices/gradingSlice';
import { vertexShaderSource } from './shaders/vertex.glsl';
import { fragmentShaderSource } from './shaders/fragment.glsl';
import { compileShader, createProgram } from './shaders/compileShader';
import { getMonotoneCubicSpline } from './math/spline';
import { mapHueToBins } from './hsl/targetTool';
import HistogramWorker from '../workers/histogramWorker?worker';
import { setHistogramData } from '../store/slices/histogramSlice';
import { store } from '../store/store';
import { throttle } from '../utils/throttle';

export class CanvasEngine {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private targetCanvas: HTMLCanvasElement | null = null;
  
  private _originalImage: HTMLImageElement | null = null;
  private _proxyTexture: WebGLTexture | null = null;
  private _histogramProxyImageData: ImageData | null = null;
  private _histogramWorker: Worker | null = null;
  
  // Curve LUT Textures
  private _curveTextures: Record<string, WebGLTexture> = {};
  
  // HSL LUT Textures
  private _hslTextures: Record<string, WebGLTexture> = {};
  
  private _uniforms: Record<string, WebGLUniformLocation> = {};
  private _needsRender: boolean = false;
  private _lastParams: string = '';

  public getCanvas(): HTMLCanvasElement | null {
    return this.targetCanvas;
  }

  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  public init(canvas: HTMLCanvasElement) {
    this.targetCanvas = canvas;
    this.gl = canvas.getContext('webgl2', { 
      preserveDrawingBuffer: true,
      antialias: false 
    });

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this._initGL();
    this._initHistogramWorker();
  }

  private _initHistogramWorker() {
    this._histogramWorker = new HistogramWorker();
    this._histogramWorker.onmessage = (e) => {
      store.dispatch(setHistogramData(e.data));
    };
  }

  private _dispatchToWorker = throttle((params: GradingState) => {
    if (!this._histogramWorker || !this._histogramProxyImageData) return;

    // Build params for worker mirroring the shader uniforms
    const workerParams = {
      contrast: (params.contrast + 100) / 100,
      saturation: (params.saturation + 100) / 100,
      temperature: params.temperature / 500,
      tint: params.tint / 500,
      shadows: this.cartesianToRGB(params.primary.shadows, 0.2),
      midtones: {
        r: Math.pow(2, (params.primary.midtones.luma - 1.0) + params.primary.midtones.x - params.primary.midtones.y / 2),
        g: Math.pow(2, (params.primary.midtones.luma - 1.0) - params.primary.midtones.x / 2 - params.primary.midtones.y / 2),
        b: Math.pow(2, (params.primary.midtones.luma - 1.0) - params.primary.midtones.x / 2 + params.primary.midtones.y),
      },
      highlights: {
        r: params.primary.highlights.luma + params.primary.highlights.x - params.primary.highlights.y / 2,
        g: params.primary.highlights.luma - params.primary.highlights.x / 2 - params.primary.highlights.y / 2,
        b: params.primary.highlights.luma - params.primary.highlights.x / 2 + params.primary.highlights.y,
      },
      global: this.cartesianToRGB(params.primary.global, 0.5),
      curves: {
        master: this._getCurveLUT(params.curves.master),
        red: this._getCurveLUT(params.curves.red),
        green: this._getCurveLUT(params.curves.green),
        blue: this._getCurveLUT(params.curves.blue),
      },
      hsl: {
        hue: this._getHslLUT(params.hsl, 'h'),
        sat: this._getHslLUT(params.hsl, 's'),
        lum: this._getHslLUT(params.hsl, 'l'),
      }
    };

    this._histogramWorker.postMessage({
      type: 'PROCESS',
      payload: { params: workerParams }
    });
  }, 100);

  private _getCurveLUT(points: { x: number; y: number }[]): Uint8Array {
    const lut = getMonotoneCubicSpline(points);
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) data[i] = Math.floor(lut[i] * 255.99);
    return data;
  }

  private _getHslLUT(hsl: HSLState, attr: 'h' | 's' | 'l'): Uint8Array {
    const data = new Uint8Array(256);
    for (let x = 0; x < 256; x++) {
      const hue = (x / 255) * 360;
      const weights = mapHueToBins(hue);
      let value = 0;
      weights.forEach(w => {
        value += hsl[w.bin as keyof HSLState][attr] * w.weight;
      });
      data[x] = Math.floor(((value + 1.0) / 2.0) * 255.99);
    }
    return data;
  }

  private _initGL() {
    const gl = this.gl!;
    
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = createProgram(gl, vertexShader, fragmentShader);

    // Cache uniforms
    const uniforms = [
      'u_texture', 'u_resolution', 'u_contrast', 'u_saturation', 'u_vibrance', 
      'u_temperature', 'u_tint', 'u_shadows', 'u_midtones', 'u_highlights', 'u_global',
      'u_curveMaster', 'u_curveRed', 'u_curveGreen', 'u_curveBlue',
      'u_hslHue', 'u_hslSat', 'u_hslLum',
      'u_showShadowClipping', 'u_showHighlightClipping'
    ];
    uniforms.forEach(name => {
      const location = gl.getUniformLocation(this.program!, name);
      if (location) this._uniforms[name] = location;
    });
    // Development-only log to verify uniform location
    if (process.env.NODE_ENV === 'development') {
      console.log('u_vibrance location:', this._uniforms['u_vibrance']);
    }


    // Initialize Curve Textures (Default identity mapping)
    const channels = ['Master', 'Red', 'Green', 'Blue'];
    const identity = new Uint8Array(256);
    for (let i = 0; i < 256; i++) identity[i] = i;

    channels.forEach(ch => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // We use LUMINANCE (or RED) for 1D LUT to save memory, 1x256
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, identity);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this._curveTextures[ch] = tex;
    });

    // Initialize HSL Textures (Default neutral/center mapping)
    const hslChannels = ['Hue', 'Sat', 'Lum'];
    const neutral = new Uint8Array(256).fill(128); // 128/255 approx 0.5 (zero delta)

    hslChannels.forEach(ch => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, neutral);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Hue is circular
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this._hslTextures[ch] = tex;
    });

    // Create Buffers for Fullscreen Quad
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,   -1,  1,
      -1,  1,   1, -1,    1,  1,
    ]), gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,   1, 0,   0, 1,
      0, 1,   1, 0,   1, 1,
    ]), gl.STATIC_DRAW);
  }

  public async loadImage(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this._originalImage = img;
        
        // Calculate Proxy Dimensions
        const maxW = Math.min(window.innerWidth, 1920);
        const maxH = Math.min(window.innerHeight, 1080);
        
        let proxyW = img.width;
        let proxyH = img.height;
        
        if (proxyW > maxW || proxyH > maxH) {
          const ratio = Math.min(maxW / proxyW, maxH / proxyH);
          proxyW = Math.floor(proxyW * ratio);
          proxyH = Math.floor(proxyH * ratio);
        }

        // Create Proxy Canvas
        const proxyCanvas = this._createProxy(img, proxyW, proxyH);
        
        // Upload to GPU
        if (this._proxyTexture) this.gl?.deleteTexture(this._proxyTexture);
        this._proxyTexture = this._uploadTexture(proxyCanvas);

        // Create Histogram Proxy (CPU side, downsampled)
        const histSize = 256;
        const histCanvas = document.createElement('canvas');
        histCanvas.width = histSize;
        histCanvas.height = histSize;
        const histCtx = histCanvas.getContext('2d')!;
        histCtx.drawImage(img, 0, 0, histSize, histSize);
        this._histogramProxyImageData = histCtx.getImageData(0, 0, histSize, histSize);
        
        // Initial setup for worker using Transferable Objects
        const buffer = this._histogramProxyImageData.data.buffer.slice(0); // Copy once to keep a main-thread copy if ever needed, or just transfer the original
        this._histogramWorker?.postMessage({
          type: 'SET_IMAGE',
          payload: { imageData: new Uint8ClampedArray(buffer) }
        }, [buffer]);
        
        // Update Target Canvas Size
        if (this.targetCanvas) {
          this.targetCanvas.width = proxyW;
          this.targetCanvas.height = proxyH;
          this.gl?.viewport(0, 0, proxyW, proxyH);
        }

        this._needsRender = true;
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private _createProxy(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  private _uploadTexture(source: HTMLCanvasElement | HTMLImageElement): WebGLTexture {
    const gl = this.gl!;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  private cartesianToRGB(wheel: WheelValue, sensitivity: number = 1.0) {
    const { x, y, luma } = wheel;
    // Map Cartesian to RGB shifts (Industry Standard approximation)
    // luma acts as a base multiplier/offset, while x/y shift color balance
    const r = (luma - 1.0) + (x * sensitivity) - (y * sensitivity / 2);
    const g = (luma - 1.0) - (x * sensitivity / 2) - (y * sensitivity / 2);
    const b = (luma - 1.0) - (x * sensitivity / 2) + (y * sensitivity);
    return { r, g, b };
  }

  public render(params: GradingState) {
    if (!this.gl || !this.program || !this._proxyTexture) return;

    const serialized = JSON.stringify(params);
    if (serialized === this._lastParams && !this._needsRender) return;
    
    this._lastParams = serialized;
    this._needsRender = false;

    const gl = this.gl;
    
    // Always ensure viewport matches the internal canvas resolution
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // Clear buffer to prevent ghosting
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Bind Attributes
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Set Uniforms
    gl.uniform2f(this._uniforms['u_resolution'], gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this._uniforms['u_contrast'], (params.contrast + 100) / 100);
    gl.uniform1f(this._uniforms['u_saturation'], (params.saturation + 100) / 100);
    gl.uniform1f(this._uniforms['u_temperature'], params.temperature / 500);
    gl.uniform1f(this._uniforms['u_tint'], params.tint / 500);
    gl.uniform1f(this._uniforms['u_vibrance'], params.vibrance / 100);

    // Shadows (Lift)
    const shadows = this.cartesianToRGB(params.primary.shadows, 0.2);
    gl.uniform3f(this._uniforms['u_shadows'], shadows.r, shadows.g, shadows.b);

    // Midtones (Gamma)
    const mid = params.primary.midtones;
    const midRGB = {
      r: Math.pow(2, (mid.luma - 1.0) + mid.x - mid.y / 2),
      g: Math.pow(2, (mid.luma - 1.0) - mid.x / 2 - mid.y / 2),
      b: Math.pow(2, (mid.luma - 1.0) - mid.x / 2 + mid.y),
    };
    gl.uniform3f(this._uniforms['u_midtones'], midRGB.r, midRGB.g, midRGB.b);

    // Highlights (Gain)
    const high = params.primary.highlights;
    gl.uniform3f(this._uniforms['u_highlights'], 
      high.luma + high.x - high.y / 2,
      high.luma - high.x / 2 - high.y / 2,
      high.luma - high.x / 2 + high.y
    );

    // Global (Offset)
    const glob = this.cartesianToRGB(params.primary.global, 0.5);
    gl.uniform3f(this._uniforms['u_global'], glob.r, glob.g, glob.b);

    // Bind Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._proxyTexture);
    gl.uniform1i(this._uniforms['u_texture'], 0);

    // Bind Curve Textures (Units 1-4)
    const curveMap = {
      'u_curveMaster': 'Master',
      'u_curveRed': 'Red',
      'u_curveGreen': 'Green',
      'u_curveBlue': 'Blue'
    };

    Object.entries(curveMap).forEach(([uniform, ch], index) => {
      const tex = this._curveTextures[ch];
      if (tex) {
        gl.activeTexture(gl.TEXTURE1 + index);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(this._uniforms[uniform], 1 + index);
      }
    });

    // Bind HSL Textures (Units 5-7)
    const hslMap = {
      'u_hslHue': 'Hue',
      'u_hslSat': 'Sat',
      'u_hslLum': 'Lum'
    };

    Object.entries(hslMap).forEach(([uniform, ch], index) => {
      const tex = this._hslTextures[ch];
      if (tex) {
        gl.activeTexture(gl.TEXTURE5 + index);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(this._uniforms[uniform], 5 + index);
      }
    });
    
    // Clipping Toggles
    const histState = store.getState().histogram;
    gl.uniform1i(this._uniforms['u_showShadowClipping'], histState.showShadowClipping ? 1 : 0);
    gl.uniform1i(this._uniforms['u_showHighlightClipping'], histState.showHighlightClipping ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Update Histogram Worker (Throttled)
    this._dispatchToWorker(params);
  }

  public updateCurveTextures(curves: CurvesState) {
    if (!this.gl) return;
    const gl = this.gl;

    const channels: (keyof CurvesState)[] = ['master', 'red', 'green', 'blue'];
    channels.forEach(ch => {
      const points = curves[ch];
      const lut = getMonotoneCubicSpline(points);
      
      // Convert Float32Array (0.0-1.0) to Uint8Array (0-255)
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        data[i] = Math.floor(lut[i] * 255.99);
      }

      const label = (ch as string).charAt(0).toUpperCase() + (ch as string).slice(1);
      const tex = this._curveTextures[label];
      if (tex) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
      }
    });

    this._needsRender = true;
  }

  public updateHslTextures(hsl: HSLState) {
    if (!this.gl) return;
    const gl = this.gl;

    const attributes: ('h' | 's' | 'l')[] = ['h', 's', 'l'];
    const labels = ['Hue', 'Sat', 'Lum'];

    attributes.forEach((attr, i) => {
      const data = new Uint8Array(256);
      
      for (let x = 0; x < 256; x++) {
        const hue = (x / 255) * 360;
        const weights = mapHueToBins(hue);
        
        let value = 0;
        weights.forEach(w => {
          value += hsl[w.bin as keyof HSLState][attr] * w.weight;
        });

        data[x] = Math.floor(((value + 1.0) / 2.0) * 255.99);
      }

      const tex = this._hslTextures[labels[i]];
      if (tex) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
      }
    });

    this._needsRender = true;
  }

  public resize(_width: number, _height: number) {
    // Note: We don't change gl.viewport here because the canvas internal resolution 
    // is fixed to the image proxy size. CSS object-contain handles display scaling.
    // We just flag a render if needed.
    if (this.gl && this.targetCanvas) {
      this._needsRender = true;
    }
  }

  public samplePixel(normX: number, normY: number): Uint8Array {
    if (!this.gl) return new Uint8Array([0,0,0,255]);
    const gl = this.gl;
    
    // WebGL coordinates start from bottom-left
    const x = Math.floor(normX * gl.drawingBufferWidth);
    const y = Math.floor((1.0 - normY) * gl.drawingBufferHeight);
    
    const pixels = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  public exportHighRes(params: GradingState): HTMLCanvasElement {
    if (!this._originalImage) throw new Error('No image loaded');

    const canvas = document.createElement('canvas');
    canvas.width = this._originalImage.width;
    canvas.height = this._originalImage.height;
    
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true })!;
    
    const vShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const prog = createProgram(gl, vShader, fShader);
    
    const pBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    
    const tBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
    
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._originalImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.useProgram(prog);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    const setUni = (name: string, type: string, ...args: any[]) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) (gl as any)[type](loc, ...args);
    };

    setUni('u_resolution', 'uniform2f', canvas.width, canvas.height);
    setUni('u_contrast', 'uniform1f', (params.contrast + 100) / 100);
    setUni('u_saturation', 'uniform1f', (params.saturation + 100) / 100);
    setUni('u_temperature', 'uniform1f', params.temperature / 500);
    setUni('u_tint', 'uniform1f', params.tint / 500);
    setUni('u_vibrance', 'uniform1f', params.vibrance / 100);

    const s = this.cartesianToRGB(params.primary.shadows, 0.2);
    setUni('u_shadows', 'uniform3f', s.r, s.g, s.b);

    const mid = params.primary.midtones;
    setUni('u_midtones', 'uniform3f', 
      Math.pow(2, (mid.luma - 1.0) + mid.x - mid.y / 2),
      Math.pow(2, (mid.luma - 1.0) - mid.x / 2 - mid.y / 2),
      Math.pow(2, (mid.luma - 1.0) - mid.x / 2 + mid.y)
    );

    const h = params.primary.highlights;
    setUni('u_highlights', 'uniform3f', 
      h.luma + h.x - h.y / 2,
      h.luma - h.x / 2 - h.y / 2,
      h.luma - h.x / 2 + h.y
    );

    const g = this.cartesianToRGB(params.primary.global, 0.5);
    setUni('u_global', 'uniform3f', g.r, g.g, g.b);

    // Curves for Export
    const channels: (keyof CurvesState)[] = ['master', 'red', 'green', 'blue'];
    channels.forEach((ch, index) => {
      const lut = getMonotoneCubicSpline(params.curves[ch]);
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) data[i] = Math.floor(lut[i] * 255.99);

      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1 + index);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const uniformName = `u_curve${(ch as string).charAt(0).toUpperCase() + (ch as string).slice(1)}`;
      const loc = gl.getUniformLocation(prog, uniformName);
      if (loc) gl.uniform1i(loc, 1 + index);
    });
    
    // HSL for Export
    const hslAttrs: ('h' | 's' | 'l')[] = ['h', 's', 'l'];
    const hslLabels = ['Hue', 'Sat', 'Lum'];
    hslAttrs.forEach((attr, i) => {
      const data = new Uint8Array(256);
      for (let x = 0; x < 256; x++) {
        const hue = (x / 255) * 360;
        const weights = mapHueToBins(hue);
        let val = 0;
        weights.forEach(w => { val += params.hsl[w.bin as keyof HSLState][attr] * w.weight; });
        data[x] = Math.floor(((val + 1.0) / 2.0) * 255.99);
      }

      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE5 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const uniformName = `u_hsl${hslLabels[i]}`;
      const loc = gl.getUniformLocation(prog, uniformName);
      if (loc) gl.uniform1i(loc, 5 + i);
    });

    const pLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const tcLoc = gl.getAttribLocation(prog, 'a_texCoord');
    gl.enableVertexAttribArray(tcLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
    gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas;
  }

  public exportToBlob(params: GradingState, format: 'jpg' | 'png' | 'gif'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = this.exportHighRes(params);
        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        const quality = format === 'jpg' ? 0.92 : undefined;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, mimeType, quality);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const canvasEngine = new CanvasEngine();
