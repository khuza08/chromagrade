import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setHslTargetActive, setHslWeights } from '../../store/slices/uiSlice';
import { setHSLChannel } from '../../store/slices/gradingSlice';
import type { RootState } from '../../store/store';
import { canvasEngine } from '../../lib/CanvasEngine';
import { rgbToHsl, mapHueToBins } from '../../lib/hsl/targetTool';
import type { HueWeight } from '../../lib/hsl/targetTool';

const TargetOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const isTargetActive = useSelector((state: RootState) => state.ui.isHslTargetActive);
  const activeAttribute = useSelector((state: RootState) => state.ui.activeHslAttribute);
  const hslState = useSelector((state: RootState) => state.grading.hsl);

  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const activeWeights = useRef<HueWeight[]>([]);
  const initialValues = useRef<Record<string, number>>({});

  if (!isTargetActive) return null;

  const handleMouseDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const canvas = canvasEngine.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    // Sample from WebGL canvas using the engine
    const pixel = canvasEngine.samplePixel(normX, normY);

    // Convert to HSL and find bins
    const { h } = rgbToHsl(pixel[0], pixel[1], pixel[2]);
    const weights = mapHueToBins(h);

    if (weights.length === 0) return;

    activeWeights.current = weights;
    startY.current = e.clientY;
    setIsDragging(true);

    // Store initial values for relative dragging
    const attrKey = activeAttribute === 'hue' ? 'h' : activeAttribute === 'sat' ? 's' : 'l';
    const weightsMap: Record<string, number> = {};
    
    weights.forEach(w => {
      initialValues.current[w.bin] = hslState[w.bin as keyof typeof hslState][attrKey];
      weightsMap[w.bin] = w.weight;
    });

    dispatch(setHslWeights(weightsMap));
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isDragging) return;

    const deltaY = startY.current - e.clientY; // Up is positive
    const sensitivity = 0.005;
    const shift = deltaY * sensitivity;

    const attrKey = activeAttribute === 'hue' ? 'h' : activeAttribute === 'sat' ? 's' : 'l';

    activeWeights.current.forEach(w => {
      const newVal = Math.max(-1, Math.min(1, initialValues.current[w.bin] + shift * w.weight));
      dispatch(setHSLChannel({ channel: w.bin as any, [attrKey]: newVal }));
    });
  };

  const handleMouseUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      dispatch(setHslTargetActive(false));
    }
    setIsDragging(false);
    dispatch(setHslWeights({}));
  };

  return (
    <div 
      className={`absolute inset-0 z-40 flex items-center justify-center bg-black/10 ${isDragging ? 'cursor-ns-resize' : 'cursor-crosshair'}`}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseUp}
    >
      {!isDragging && (
        <div className="bg-black/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full pointer-events-none">
          <span className="text-[14px] font-semibold text-white uppercase">
            Drag vertically on image to adjust {activeAttribute}
          </span>
        </div>
      )}
    </div>
  );
};

export default TargetOverlay;
