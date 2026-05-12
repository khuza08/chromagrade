import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setCurvePoints } from '../../store/slices/gradingSlice';
import type { CurvePoint, CurvesState } from '../../store/slices/gradingSlice';
import { getMonotoneCubicSpline } from '../../lib/math/spline';
import { canvasEngine } from '../../lib/CanvasEngine';
import { histogramGenerator } from '../../lib/HistogramGenerator';
import type { HistogramData } from '../../lib/HistogramGenerator';

interface CurveGraphProps {
  channel: keyof CurvesState;
  points: CurvePoint[];
  isPickerActive: boolean;
  histogramData?: HistogramData | null;
}

const CurveGraph: React.FC<CurveGraphProps> = ({ channel, points, isPickerActive, histogramData }) => {
  const dispatch = useDispatch();
  const allCurves = useSelector((state: RootState) => state.grading.curves);
  const svgRef = useRef<SVGSVGElement>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Generate 256 points for the curve path to match the shader exactly
  const curvePath = useMemo(() => {
    const lut = getMonotoneCubicSpline(points);
    let path = `M 0 ${256 - lut[0] * 256}`;
    for (let i = 1; i < 256; i++) {
      path += ` L ${(i / 255) * 256} ${256 - lut[i] * 256}`;
    }
    return path;
  }, [points]);

  // Sync engine whenever ANY curves change
  useEffect(() => {
    canvasEngine.updateCurveTextures(allCurves);
  }, [allCurves]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
    };
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDragIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragIndex === null) return;
    const pos = getMousePos(e);
    
    // Magnetic snap to diagonal
    if (Math.abs(pos.x - pos.y) < 0.03) {
      pos.y = pos.x;
    }

    const newPoints = [...points];
    
    // Constraints: First point x=0, Last point x=1
    if (dragIndex === 0) pos.x = 0;
    if (dragIndex === points.length - 1) pos.x = 1;
    
    // Prevent overlapping points x-wise
    if (dragIndex > 0 && pos.x <= points[dragIndex - 1].x) pos.x = points[dragIndex - 1].x + 0.001;
    if (dragIndex < points.length - 1 && pos.x >= points[dragIndex + 1].x) pos.x = points[dragIndex + 1].x - 0.001;

    newPoints[dragIndex] = pos;
    dispatch(setCurvePoints({ channel, points: newPoints }));
  };

  const handleMouseUp = () => {
    setDragIndex(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    // Check if we clicked on a point to remove it
    const clickIndex = points.findIndex(p => 
      Math.abs(p.x - pos.x) < 0.06 && Math.abs(p.y - pos.y) < 0.06
    );

    if (clickIndex !== -1 && clickIndex !== 0 && clickIndex !== points.length - 1) {
      const newPoints = points.filter((_, i) => i !== clickIndex);
      dispatch(setCurvePoints({ channel, points: newPoints }));
    } else if (clickIndex === -1) {
      // Add point
      const newPoints = [...points, pos].sort((a, b) => a.x - b.x);
      dispatch(setCurvePoints({ channel, points: newPoints }));
    }
  };

  const channelColor = channel === 'red' ? '#ef4444' : channel === 'green' ? '#22c55e' : channel === 'blue' ? '#3b82f6' : '#fff';

  // Render Histogram to background canvas
  useEffect(() => {
    if (!histogramCanvasRef.current || !histogramData) return;
    const ctx = histogramCanvasRef.current.getContext('2d')!;
    const w = 256;
    const h = 256;
    
    ctx.clearRect(0, 0, w, h);
    
    const drawBin = (data: number[], color: string, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const val = (data[i] / histogramData.max) * h * 0.8; // Scale to 80% height
        ctx.lineTo(i, h - val);
      }
      ctx.lineTo(256, h);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    };

    // Draw Luma Ghosting
    drawBin(histogramData.master, '#888', 0.2);
    
    // Draw Active Channel
    if (channel !== 'master') {
      drawBin(histogramData[channel], channelColor, 0.3);
    }

    ctx.globalAlpha = 1.0;
  }, [histogramData, channel, channelColor]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={histogramCanvasRef}
        width={256}
        height={256}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
      />
      <svg
        ref={svgRef}
        viewBox="0 0 256 256"
        className="absolute inset-0 w-full h-full cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
      {/* Grid */}
      <g stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2">
        <line x1="64" y1="0" x2="64" y2="256" />
        <line x1="128" y1="0" x2="128" y2="256" />
        <line x1="192" y1="0" x2="192" y2="256" />
        <line x1="0" y1="64" x2="256" y2="64" />
        <line x1="0" y1="128" x2="256" y2="128" />
        <line x1="0" y1="192" x2="256" y2="192" />
      </g>

      {/* Identity Diagonal */}
      <line x1="0" y1="256" x2="256" y2="0" stroke="white" strokeWidth="0.5" opacity="0.1" />

      {/* Curve Line */}
      <path
        d={curvePath}
        fill="none"
        stroke={channelColor}
        strokeWidth="2"
        strokeLinejoin="round"
        className="pointer-events-none shadow-lg shadow-black/50"
      />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i} className="group/point">
          {/* Invisible larger hit target */}
          <circle
            cx={p.x * 256}
            cy={256 - p.y * 256}
            r={12}
            fill="transparent"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleMouseDown(e, i)}
          />
          {/* Visible point */}
          <circle
            cx={p.x * 256}
            cy={256 - p.y * 256}
            r={dragIndex === i ? 6 : 4}
            fill={dragIndex === i ? 'white' : channelColor}
            stroke="var(--bg-panel)"
            strokeWidth="1"
            className="pointer-events-none transition-all group-hover/point:r-[6px]"
            style={{ 
              transition: 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              // Fallback for browsers that don't support CSS 'r'
              transformOrigin: 'center',
              transformBox: 'fill-box'
            }}
          />
        </g>
      ))}
      </svg>
    </div>
  );
};

export default CurveGraph;
