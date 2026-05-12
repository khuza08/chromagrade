import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RotateCcw } from 'lucide-react';
import { canvasEngine } from '../../lib/CanvasEngine';
import type { RootState } from '../../store/store';

interface PerformanceSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void; // This will be the Redux dispatch
  onReset?: () => void;
}

const PerformanceSlider: React.FC<PerformanceSliderProps> = ({ 
  label, min, max, step = 1, value, onChange, onReset 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isDragging = useRef(false);
  const currentGrading = useSelector((state: RootState) => state.grading);

  // Sync with Redux when it changes from outside (e.g. Undo/Redo)
  useEffect(() => {
    if (!isDragging.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setLocalValue(newVal);
    isDragging.current = true;

    // Direct engine update for 60fps performance
    const tempParams = { ...currentGrading };
    const labelLower = label.toLowerCase();
    if (labelLower === 'contrast') tempParams.contrast = newVal;
    else if (labelLower === 'saturation') tempParams.saturation = newVal;
    else if (labelLower === 'temperature') tempParams.temperature = newVal;
    else if (labelLower === 'tint') tempParams.tint = newVal;
    
    canvasEngine.render(tempParams);
  };

  const handleRelease = () => {
    isDragging.current = false;
    onChange(localValue);
  };

  return (
    <div className="space-y-1.5 w-full group">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {onReset && (
            <button 
              onClick={onReset}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[var(--accent-blue)] text-[var(--text-tertiary)] transition-all cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={10} />
            </button>
          )}
          <span className="text-[10px] font-mono text-[var(--accent-blue)] bg-[var(--bg-control)] px-1.5 py-0.5 rounded min-w-[32px] text-center">
            {localValue > 0 ? `+${localValue}` : localValue}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleDrag}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="w-full h-1 bg-[var(--bg-control)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)] hover:accent-blue-400 transition-all"
      />
    </div>
  );
};

export default PerformanceSlider;
