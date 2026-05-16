import React, { useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { toggleShadowClipping, toggleHighlightClipping } from '../../store/slices/histogramSlice';
import { AlertTriangle } from 'lucide-react';

const Histogram: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  
  const { red, green, blue, luma, showShadowClipping, showHighlightClipping } = useSelector((state: RootState) => state.histogram);
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    // Sync canvas resolution to display size
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!hasImage) return;

    // Find max value to scale the histogram (using sqrt for better visibility of smaller peaks)
    // We use a simple loop instead of spreading to avoid potential stack issues
    let maxCount = 1;
    for (let i = 0; i < 256; i++) {
      maxCount = Math.max(maxCount, red[i], green[i], blue[i], luma[i]);
    }
    const maxVal = Math.sqrt(maxCount);

    const drawPath = (data: number[], color: string, fill: boolean = true) => {
      ctx.beginPath();
      
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const val = Math.sqrt(data[i]);
        const y = height - (val / maxVal) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (fill) {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }
    };

    // Use screen composite mode for additive blending
    ctx.globalCompositeOperation = 'screen';

    // Draw R, G, B
    drawPath(red, 'rgba(255, 0, 0, 0.6)');
    drawPath(green, 'rgba(0, 255, 0, 0.6)');
    drawPath(blue, 'rgba(0, 0, 255, 0.6)');

    // Draw Luma (weighted) - drawn on top with source-over
    ctx.globalCompositeOperation = 'source-over';
    drawPath(luma, 'rgba(255, 255, 255, 0.4)', false);

  }, [red, green, blue, luma, hasImage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      draw();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div 
      ref={containerRef}
      className="bg-black/40 rounded-lg overflow-hidden border border-[var(--border)] group relative h-32"
    >
      {/* Clipping Triangles */}
      <div className="absolute top-1 left-1 z-10">
        <button
          onClick={() => dispatch(toggleShadowClipping())}
          className={`p-0.5 rounded transition-colors ${
            showShadowClipping ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Show Shadow Clipping"
        >
          <AlertTriangle size={12} fill={showShadowClipping ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="absolute top-1 right-1 z-10">
        <button
          onClick={() => dispatch(toggleHighlightClipping())}
          className={`p-0.5 rounded transition-colors ${
            showHighlightClipping ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Show Highlight Clipping"
        >
          <AlertTriangle size={12} fill={showHighlightClipping ? 'currentColor' : 'none'} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      
      {!hasImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-medium">
            No Data
          </span>
        </div>
      )}
    </div>
  );
};

export default Histogram;
