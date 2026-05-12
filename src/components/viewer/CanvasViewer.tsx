import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setImage } from '../../store/slices/imageSlice';
import { canvasEngine } from '../../lib/CanvasEngine';
import { Upload, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

const CanvasViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { originalUrl } = useSelector((state: RootState) => state.image);
  const gradingParams = useSelector((state: RootState) => state.grading);
  const [isDragging, setIsDragging] = useState(false);
  const isGLInitialized = useRef(false);

  // Initialize WebGL ONCE on component mount — canvas is always in the DOM
  useEffect(() => {
    if (canvasRef.current && !isGLInitialized.current) {
      canvasEngine.init(canvasRef.current);
      isGLInitialized.current = true;
    }
  }, []); // Empty deps: runs exactly once after first render

  // Redraw when grading params change (only if an image is loaded)
  useEffect(() => {
    if (originalUrl) {
      canvasEngine.render(gradingParams);
    }
  }, [gradingParams, originalUrl]);

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

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    // loadImage now has a valid GL context because init() ran on mount
    const dimensions = await canvasEngine.loadImage(url);

    dispatch(setImage({
      url,
      width: dimensions.width,
      height: dimensions.height,
      name: file.name,
    }));

    // Render immediately after texture is uploaded
    canvasEngine.render(gradingParams);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    // Always render the container and canvas — they never unmount
    <div
      ref={containerRef}
      className="w-full h-full relative group bg-[var(--bg-base)] overflow-hidden flex items-center justify-center"
    >
      {/* Drop zone overlay — shown when no image is loaded */}
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

      {/* WebGL Canvas — always mounted so init() always has a valid ref */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain shadow-2xl shadow-black/50"
        style={{ imageRendering: 'auto', display: originalUrl ? 'block' : 'none' }}
      />

      {/* Viewer HUD — only visible when image is loaded */}
      {originalUrl && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 bg-[var(--bg-panel)]/80 hover:bg-[var(--bg-panel)] rounded-lg backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]">
              <ZoomIn size={18} />
            </button>
            <button className="p-2 bg-[var(--bg-panel)]/80 hover:bg-[var(--bg-panel)] rounded-lg backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]">
              <ZoomOut size={18} />
            </button>
            <button className="p-2 bg-[var(--bg-panel)]/80 hover:bg-[var(--bg-panel)] rounded-lg backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]">
              <Maximize size={18} />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[var(--bg-panel)]/80 backdrop-blur-md rounded-md text-[10px] font-mono text-[var(--text-tertiary)] tracking-wider uppercase border border-[var(--border)]">
            4K RAW • 16-BIT • sRGB
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasViewer;
