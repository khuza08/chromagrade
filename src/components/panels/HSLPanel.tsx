import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RotateCcw } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { HSLState } from '../../store/slices/gradingSlice';
import { resetAllHSL } from '../../store/slices/gradingSlice';
import HSLHeaderDot from '../ui/HSLHeaderDot';
import HSLSlider from '../ui/HSLSlider';

const HSLPanel: React.FC = () => {
  const dispatch = useDispatch();
  const activeAttribute = useSelector((state: RootState) => state.ui.activeHslAttribute);

  const colorBins: { id: keyof HSLState; label: string; hue: number }[] = [
    { id: 'red',     label: 'Red',     hue: 0 },
    { id: 'orange',  label: 'Orange',  hue: 30 },
    { id: 'yellow',  label: 'Yellow',  hue: 60 },
    { id: 'green',   label: 'Green',   hue: 120 },
    { id: 'aqua',    label: 'Aqua',    hue: 180 },
    { id: 'blue',    label: 'Blue',    hue: 240 },
    { id: 'purple',  label: 'Purple',  hue: 280 },
    { id: 'magenta', label: 'Magenta', hue: 320 },
  ];

  const attributeLabels = {
    hue: 'Hue Shift',
    sat: 'Saturation',
    lum: 'Luminance',
  };

  const attributeKeys: Record<'hue' | 'sat' | 'lum', 'h' | 's' | 'l'> = {
    hue: 'h',
    sat: 's',
    lum: 'l',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] p-4 gap-6 overflow-hidden">
      {/* Header with Target Tool Selection */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <HSLHeaderDot attribute="hue" label="Hue" />
            <HSLHeaderDot attribute="sat" label="Sat" />
            <HSLHeaderDot attribute="lum" label="Lum" />
          </div>
          <button
            onClick={() => dispatch(resetAllHSL())}
            className="p-1.5 rounded-md hover:bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors group"
            title="Reset All HSL"
          >
            <RotateCcw size={14} className="group-active:rotate-[-90deg] transition-transform duration-200" />
          </button>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
            {attributeLabels[activeAttribute]}
          </span>
          <span className="text-[9px] text-[var(--text-tertiary)] italic">
            Targeted Color Grading
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 pt-2">
          {colorBins.map((bin) => (
            <HSLSlider
              key={bin.id}
              channel={bin.id}
              type={attributeKeys[activeAttribute]}
              label={bin.label}
              hueDeg={bin.hue}
            />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          Tip: Select an attribute, activate the Target Tool, then drag vertically on the image to adjust mixed colors.
        </p>
      </div>
    </div>
  );
};

export default HSLPanel;
