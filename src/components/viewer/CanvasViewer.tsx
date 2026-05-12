import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setImage } from '../../store/slices/imageSlice';
import { canvasEngine } from '../../lib/CanvasEngine';
import { Upload, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

const CanvasViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { originalUrl } = useSelector((state: RootState) => state.image);
  const gradingParams = useSelector((state: RootState) => state.grading);
  const [isDragging, setIsDragging] = useState(false);

  // Redraw when grading params change
  useEffect(() => {
    if (originalUrl && canvasRef.current) {
      canvasEngine.setTarget(canvasRef.current);
      canvasEngine.render(gradingParams);
    }
  }, [gradingParams, originalUrl]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const url = URL.createObjectURL(file);
    const dimensions = await canvasEngine.loadImage(url);
    
    dispatch(setImage({
      url,
      width: dimensions.width,
      height: dimensions.height,
      name: file.name
    }));
    
    // Initial render
    canvasEngine.render(gradingParams);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  if (!originalUrl) {
    return (
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`w-full h-full flex flex-col items-center justify-center transition-colors duration-300 ${isDragging ? 'bg-[var(--accent-blue)]/10' : ''}`}
      >
        <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center gap-6 transition-all ${isDragging ? 'border-[var(--accent-blue)] scale-105 bg-[var(--bg-panel)] shadow-2xl' : 'border-[var(--border)]'}`}>
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-control)] flex items-center justify-center shadow-inner">
            <Upload size={32} className={isDragging ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Drop your masterpiece here</h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-xs">Supports RAW, JPG, PNG and WebP formats</p>
          </div>
          <label className="bg-[var(--accent-blue)] hover:bg-blue-600 text-white px-8 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-900/30">
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
    );
  }

  return (
    <div className="w-full h-full relative group bg-[#050505] overflow-hidden flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Viewer HUD */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-md text-white/70 hover:text-white transition-all">
          <ZoomIn size={18} />
        </button>
        <button className="p-2 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-md text-white/70 hover:text-white transition-all">
          <ZoomOut size={18} />
        </button>
        <button className="p-2 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-md text-white/70 hover:text-white transition-all">
          <Maximize size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-mono text-white/40 tracking-wider uppercase">
        4K RAW • 16-BIT • sRGB
      </div>
    </div>
  );
};

export default CanvasViewer;
