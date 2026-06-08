import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setHSLChannel, resetHSLChannel } from '../../store/slices/gradingSlice';
import type { HSLState } from '../../store/slices/gradingSlice';
import type { RootState } from '../../store/store';
import './SliderGlow.css';

interface HSLSliderProps {
  channel: keyof HSLState;
  type: 'h' | 's' | 'l';
  label: string;
  hueDeg: number;
  singleColorMode?: boolean;
}

const HSLSlider: React.FC<HSLSliderProps> = ({ channel, type, label, hueDeg, singleColorMode }) => {
  const dispatch = useDispatch();
  const value = useSelector((state: RootState) => state.grading.hsl[channel][type]);
  const glowWeight = useSelector((state: RootState) => state.ui.hslWeights[channel] || 0); 
  const isGlowActive = glowWeight > 0 && !singleColorMode;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setHSLChannel({ channel, [type]: parseFloat(e.target.value) }));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(resetHSLChannel(channel));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <div className="flex justify-between items-center px-1">
        <button 
          onDoubleClick={handleReset}
          className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-default select-none"
          title="Double-click label to reset color bin"
        >
          {label}
        </button>
        <span className="text-[9px] font-mono text-[var(--text-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity">
          {value > 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={value}
          onChange={handleChange}
          className={`hsl-slider-input ${isGlowActive ? 'slider-glow' : ''}`}
          style={{ 
            '--glow-color': `hsl(${hueDeg}, 100%, 70%)`,
            '--glow-opacity': isGlowActive ? glowWeight : 0 
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
};

export default React.memo(HSLSlider);
