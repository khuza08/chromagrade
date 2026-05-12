import type { GradingState } from '../store/slices/gradingSlice';
import { vertexShaderSource } from './shaders/vertex.glsl';
import { fragmentShaderSource } from './shaders/fragment.glsl';
import { compileShader, createProgram } from './shaders/compileShader';

export class CanvasEngine {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private targetCanvas: HTMLCanvasElement | null = null;
  
  private _originalImage: HTMLImageElement | null = null;
  private _proxyTexture: WebGLTexture | null = null;
  
  private _uniforms: Record<string, WebGLUniformLocation> = {};
  private _needsRender: boolean = false;
  private _lastParams: string = '';

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
  }

  private _initGL() {
    const gl = this.gl!;
    
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = createProgram(gl, vertexShader, fragmentShader);

    // Cache uniforms
    const uniforms = [
      'u_texture', 'u_resolution', 'u_contrast', 'u_saturation', 
      'u_temperature', 'u_tint', 'u_lift', 'u_gamma', 'u_gain'
    ];
    uniforms.forEach(name => {
      const location = gl.getUniformLocation(this.program!, name);
      if (location) this._uniforms[name] = location;
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

  public render(params: GradingState) {
    if (!this.gl || !this.program || !this._proxyTexture) return;

    const serialized = JSON.stringify(params);
    if (serialized === this._lastParams && !this._needsRender) return;
    
    this._lastParams = serialized;
    this._needsRender = false;

    const gl = this.gl;
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
    
    // Sliders: -100..100 -> 0..2 (Pivot 1.0)
    gl.uniform1f(this._uniforms['u_contrast'], (params.contrast + 100) / 100);
    gl.uniform1f(this._uniforms['u_saturation'], (params.saturation + 100) / 100);
    
    // Temp/Tint: -100..100 -> -0.2..0.2
    gl.uniform1f(this._uniforms['u_temperature'], params.temperature / 500);
    gl.uniform1f(this._uniforms['u_tint'], params.tint / 500);

    // Wheels: -100..100 maps to specific shader ranges
    // Lift: -0.5..0.5
    gl.uniform3f(this._uniforms['u_lift'], 
      params.primary.lift.r / 200, 
      params.primary.lift.g / 200, 
      params.primary.lift.b / 200
    );

    // Gamma: 0.1..5.0 (default 1.0)
    const mapGamma = (v: number) => Math.pow(2, v / 50); // -100 -> 0.25, 0 -> 1, 100 -> 4
    gl.uniform3f(this._uniforms['u_gamma'], 
      mapGamma(params.primary.gamma.r),
      mapGamma(params.primary.gamma.g),
      mapGamma(params.primary.gamma.b)
    );

    // Gain: 0..5 (default 1.0)
    const mapGain = (v: number) => (v + 100) / 100; // -100 -> 0, 0 -> 1, 100 -> 2
    gl.uniform3f(this._uniforms['u_gain'], 
      mapGain(params.primary.gain.r),
      mapGain(params.primary.gain.g),
      mapGain(params.primary.gain.b)
    );

    // Bind Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._proxyTexture);
    gl.uniform1i(this._uniforms['u_texture'], 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public resize(width: number, height: number) {
    if (this.gl && this.targetCanvas) {
      this.gl.viewport(0, 0, width, height);
      this._needsRender = true;
    }
  }

  public exportHighRes(params: GradingState): HTMLCanvasElement {
    if (!this._originalImage) throw new Error('No image loaded');

    const canvas = document.createElement('canvas');
    canvas.width = this._originalImage.width;
    canvas.height = this._originalImage.height;
    
    // We can reuse the engine logic or create a temporary one
    // For simplicity, we'll create a temporary context
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true })!;
    
    // Re-init for export context
    const vShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const prog = createProgram(gl, vShader, fShader);
    
    // Set up geometry
    const pBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    
    const tBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
    
    // Upload original image
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._originalImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Draw
    gl.useProgram(prog);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Set Uniforms (Simplified for export helper)
    const setUni = (name: string, type: string, ...args: any[]) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) (gl as any)[type](loc, ...args);
    };

    setUni('u_resolution', 'uniform2f', canvas.width, canvas.height);
    setUni('u_contrast', 'uniform1f', (params.contrast + 100) / 100);
    setUni('u_saturation', 'uniform1f', (params.saturation + 100) / 100);
    setUni('u_temperature', 'uniform1f', params.temperature / 500);
    setUni('u_tint', 'uniform1f', params.tint / 500);
    setUni('u_lift', 'uniform3f', params.primary.lift.r/200, params.primary.lift.g/200, params.primary.lift.b/200);
    const mapGamma = (v: number) => Math.pow(2, v / 50);
    setUni('u_gamma', 'uniform3f', mapGamma(params.primary.gamma.r), mapGamma(params.primary.gamma.g), mapGamma(params.primary.gamma.b));
    const mapGain = (v: number) => (v + 100) / 100;
    setUni('u_gain', 'uniform3f', mapGain(params.primary.gain.r), mapGain(params.primary.gain.g), mapGain(params.primary.gain.b));

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
