import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

interface PerformanceSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void; // This will be the Redux dispatch
  onReset?: () => void;
  trackGradient?: string;
  showTicks?: boolean;
}

const SLIDER_RAF_DEBOUNCE = 'rAF';

const PerformanceSlider: React.FC<PerformanceSliderProps> = ({ 
  label, min, max, step = 1, value, onChange, onReset, trackGradient, showTicks
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isDragging = useRef(false);
  const rafId = useRef<number | null>(null);
  const pendingValue = useRef(value);

  // Sync with Redux when it changes from outside (e.g. Undo/Redo)
  useEffect(() => {
    if (!isDragging.current) {
      setLocalValue(value);
      pendingValue.current = value;
    }
  }, [value]);

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setLocalValue(newVal);
    isDragging.current = true;
    pendingValue.current = newVal;

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        onChange(pendingValue.current);
        rafId.current = null;
      });
    }
  };

  const handleRelease = () => {
    isDragging.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    onChange(localValue);
  };

  const displayValue = step < 1 
    ? (localValue > 0 ? `+${localValue.toFixed(2)}` : localValue.toFixed(2))
    : (localValue > 0 ? `+${localValue}` : localValue);

  return (
    <div className="flex items-center gap-2 w-full group">
      <label className="text-[11px] text-[var(--text-secondary)] w-[72px] shrink-0">
        {label}
      </label>
      
      <div className="relative flex-1 flex items-center h-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleDrag}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          style={{ background: trackGradient ?? undefined }}
          className="w-full h-1 bg-[var(--bg-control)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)] transition-all z-10"
        />
        {showTicks && (
          <div className="absolute top-[10px] w-full flex justify-between px-[6px] pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-px h-1 bg-[var(--text-tertiary)] opacity-40" />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 w-10 justify-end shrink-0">
        {onReset && (
          <button 
            onClick={onReset}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[var(--theme-primary)] text-[var(--text-tertiary)] transition-all cursor-pointer"
            title="Reset"
          >
            <RotateCcw size={10} />
          </button>
        )}
        <span className="text-[11px] font-mono text-[var(--text-primary)] w-9 text-right tabular-nums">
          {displayValue}
        </span>
      </div>
    </div>
  );
};

export default React.memo(PerformanceSlider);
