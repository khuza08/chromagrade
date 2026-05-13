import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { store } from '../../store/store';
import type { RootState } from '../../store/store';
import { setImage } from '../../store/slices/imageSlice';
import { canvasEngine } from '../../lib/CanvasEngine';
import { setPickerActive } from '../../store/slices/uiSlice';
import { setCurvePoints } from '../../store/slices/gradingSlice';
import { Upload, Maximize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import TargetOverlay from './TargetOverlay';

const CanvasViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { originalUrl, dimensions, fileName } = useSelector((state: RootState) => state.image);
  const { activeBottomTab, isPickerActive } = useSelector((state: RootState) => state.ui);
  const { curves } = useSelector((state: RootState) => state.grading);
  const gradingParams = useSelector((state: RootState) => state.grading);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const isGLInitialized = useRef(false);

  // Initialize WebGL ONCE on component mount — canvas is always in the DOM
  useEffect(() => {
    if (canvasRef.current && !isGLInitialized.current) {
      canvasEngine.init(canvasRef.current);
      isGLInitialized.current = true;
    }
  }, []);

  // Sync Fullscreen State
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      // Immediately trigger engine resize for resolution awareness
      if (containerRef.current) {
        canvasEngine.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Redraw when grading params change
  useEffect(() => {
    if (originalUrl) {
      canvasEngine.render(gradingParams);
    }
  }, [gradingParams, originalUrl]);

  // Update Curve and HSL Textures separately to avoid excessive LUT generation
  useEffect(() => {
    canvasEngine.updateCurveTextures(curves);
  }, [curves]);

  useEffect(() => {
    canvasEngine.updateHslTextures(gradingParams.hsl);
  }, [gradingParams.hsl]);


  // Handle Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      canvasEngine.resize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight
      );
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const calculateFitZoom = () => {
    if (!containerRef.current || !canvasRef.current) return 1.0;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const canvasW = canvasRef.current.width;
    const canvasH = canvasRef.current.height;

    if (canvasW === 0 || canvasH === 0) return 1.0;

    return Math.min(
      (containerW - 40) / canvasW,
      (containerH - 40) / canvasH,
      1.0
    );
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.05, Math.min(10.0, prev + delta)));
  };

  const resetZoom = () => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Allow panning if zoomed in OR if the image is larger than container
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isPickerActive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Sample pixel from canvas
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixelX = Math.floor(x * canvasRef.current.width);
    const pixelY = Math.floor(y * canvasRef.current.height);
    const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;

    // Get value based on active curve channel
    let value = 0;
    const activeCurveChannel = (store.getState() as RootState).ui.activeCurveChannel;

    if (activeCurveChannel === 'master') {
      // Rec. 709 Luma
      value = (0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]) / 255;
    } else if (activeCurveChannel === 'red') {
      value = pixel[0] / 255;
    } else if (activeCurveChannel === 'green') {
      value = pixel[1] / 255;
    } else if (activeCurveChannel === 'blue') {
      value = pixel[2] / 255;
    }
    
    if (activeBottomTab === 'curves') {
      const currentPoints = curves[activeCurveChannel];
      const newPoints = [...currentPoints, { x: value, y: value }].sort((a, b) => a.x - b.x);
      dispatch(setCurvePoints({ channel: activeCurveChannel, points: newPoints }));
    }

    dispatch(setPickerActive(false));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const dimensions = await canvasEngine.loadImage(url);
    
    dispatch(setImage({
      url,
      width: dimensions.width,
      height: dimensions.height,
      name: file.name,
    }));
    
    canvasEngine.render(gradingParams);
    
    // Defer zoom calculation slightly to ensure DOM has updated canvas dimensions
    setTimeout(() => {
      const fit = calculateFitZoom();
      setZoom(fit);
      setPan({ x: 0, y: 0 });
    }, 50);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative group bg-[var(--bg-base)] overflow-hidden flex items-center justify-center transition-colors duration-500 ${isFullscreen ? 'bg-black' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drop zone overlay */}
      {!originalUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-colors duration-300 ${isDragging ? 'bg-[var(--accent-blue)]/10' : 'bg-[var(--bg-base)]'}`}
        >
          <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center gap-6 transition-all ${isDragging ? 'border-[var(--accent-blue)] scale-105 bg-[var(--bg-panel)] shadow-2xl' : 'border-[var(--border)]'}`}>
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-control)] flex items-center justify-center shadow-inner">
              <Upload size={32} className={isDragging ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Drop your masterpiece here</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-xs">Supports RAW, JPG, PNG and WebP formats</p>
            </div>
            <label className="bg-[var(--accent-blue)] hover:opacity-90 text-white px-8 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-[var(--accent-blue)]/20">
              Browse Files
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      )}

      {/* WebGL Canvas */}
      <TargetOverlay />
      <canvas
        ref={canvasRef}
        className="object-contain shadow-2xl shadow-black/50 transition-shadow duration-300"
        style={{ 
          display: originalUrl ? 'block' : 'none',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          imageRendering: zoom > 1.0 ? 'pixelated' : 'auto',
          cursor: isPickerActive ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
        }}
        onDoubleClick={resetZoom}
        onClick={handleCanvasClick}
      />

      {/* Viewer HUD */}
      {originalUrl && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-panel)]/20 backdrop-blur-md rounded-lg border border-[var(--border)] mr-2 group/zoom">
              <span className="text-[10px] font-mono text-[var(--accent-blue)] min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={resetZoom}
                className="hover:text-[var(--accent-blue)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw size={10} />
              </button>
            </div>
            <button 
              onClick={() => handleZoom(0.2)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={() => handleZoom(-0.2)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
            >
              <ZoomOut size={18} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className={`p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg backdrop-blur-md transition-all border border-[var(--border)] ${isFullscreen ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <Maximize size={18} />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[var(--bg-panel)]/20 backdrop-blur-md rounded-md text-[10px] font-mono text-[var(--text-tertiary)] tracking-wider uppercase border border-[var(--border)] z-20 flex gap-3">
            <span>
              {dimensions ? (
                dimensions.width >= 3840 ? '4K' :
                dimensions.width >= 2560 ? 'QHD' :
                dimensions.width >= 1920 ? 'FHD' :
                dimensions.width >= 1280 ? 'HD' : 'SD'
              ) : '---'}
              {' '}
              {fileName?.split('.').pop() || 'IMG'}
            </span>
            <span className="opacity-30">•</span>
            <span>{dimensions ? `${dimensions.width}x${dimensions.height}` : '0x0'}</span>
            <span className="opacity-30">•</span>
            <span>sRGB</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasViewer;
