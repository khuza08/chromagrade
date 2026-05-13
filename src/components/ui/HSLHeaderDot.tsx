import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Target } from 'lucide-react';
import { setActiveHslAttribute, setHslTargetActive, setHslViewMode } from '../../store/slices/uiSlice';
import type { RootState } from '../../store/store';

interface HSLHeaderDotProps {
  attribute: 'hue' | 'sat' | 'lum';
  label: string;
}

const HSLHeaderDot: React.FC<HSLHeaderDotProps> = ({ attribute, label }) => {
  const dispatch = useDispatch();
  const activeAttribute = useSelector((state: RootState) => state.ui.activeHslAttribute);
  const isTargetActive = useSelector((state: RootState) => state.ui.isHslTargetActive);

  const isActive = activeAttribute === attribute && isTargetActive;

  const handleClick = () => {
    if (isActive) {
      dispatch(setHslTargetActive(false));
    } else {
      dispatch(setActiveHslAttribute(attribute));
      dispatch(setHslTargetActive(true));
      dispatch(setHslViewMode('hsl'));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all border ${
        isActive
          ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
      title={`Targeted Adjustment: ${label}`}
    >
      <Target size={14} className={isActive ? 'animate-pulse' : ''} />
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
};

export default HSLHeaderDot;
