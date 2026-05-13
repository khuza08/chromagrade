import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RotateCcw } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { HSLState } from '../../store/slices/gradingSlice';
import { resetAllHSL, resetHSLChannel } from '../../store/slices/gradingSlice';
import { setHslViewMode, setActiveColorBin } from '../../store/slices/uiSlice';
import HSLHeaderDot from '../ui/HSLHeaderDot';
import HSLSlider from '../ui/HSLSlider';

const HSLPanel: React.FC = () => {
  const dispatch = useDispatch();
  const activeAttribute = useSelector((state: RootState) => state.ui.activeHslAttribute);
  const viewMode = useSelector((state: RootState) => state.ui.hslViewMode);
  const activeBinId = useSelector((state: RootState) => state.ui.activeColorBin);

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

  const activeBin = colorBins.find(b => b.id === activeBinId) || colorBins[0];

  const handleReset = () => {
    if (viewMode === 'hsl') {
      dispatch(resetAllHSL());
    } else {
      dispatch(resetHSLChannel(activeBinId));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] p-4 gap-6 overflow-hidden">
      {/* Header with Target Tool Selection */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          {viewMode === 'hsl' && (
            <div className="flex gap-2">
              <HSLHeaderDot attribute="hue" label="Hue" />
              <HSLHeaderDot attribute="sat" label="Sat" />
              <HSLHeaderDot attribute="lum" label="Lum" />
            </div>
          )}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors group"
            title={viewMode === 'hsl' ? "Reset All HSL" : `Reset ${activeBin.label}`}
          >
            <RotateCcw size={14} className="group-active:rotate-[-90deg] transition-transform duration-200" />
          </button>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-[var(--bg-control)] rounded-full px-2 py-0.5 border border-[var(--border)]">
            <button 
              onClick={() => dispatch(setHslViewMode('hsl'))}
              className={`hsl-toggle ${viewMode === 'hsl' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)] opacity-40 hover:opacity-100'}`}
            >
              HSL
            </button>
            <div className="w-[1px] h-2 bg-[var(--border)]" />
            <button 
              onClick={() => dispatch(setHslViewMode('color'))}
              className={`hsl-toggle ${viewMode === 'color' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-tertiary)] opacity-40 hover:opacity-100'}`}
            >
              Color
            </button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
              {viewMode === 'hsl' ? attributeLabels[activeAttribute] : `${activeBin.label.toUpperCase()} CHANNEL`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {viewMode === 'hsl' ? (
          <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
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
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-12 max-w-4xl w-full px-4">
            {/* Left Column: Swatch Grid */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="grid grid-cols-3 gap-4">
                {colorBins.map((bin) => (
                  <button
                    key={bin.id}
                    onClick={() => dispatch(setActiveColorBin(bin.id))}
                    className={`color-swatch ${activeBinId === bin.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-panel)] scale-125' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: `hsl(${bin.hue}, 80%, 50%)` }}
                    title={bin.label}
                    aria-label={bin.label}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Triple Sliders */}
            <div className="flex-1 w-full space-y-2">
              {(['h', 's', 'l'] as const).map((t) => (
                <HSLSlider
                  key={`${activeBinId}-${t}`}
                  channel={activeBinId}
                  type={t}
                  label={t === 'h' ? 'HUE' : t === 's' ? 'SATURATION' : 'LUMINANCE'}
                  hueDeg={activeBin.hue}
                  singleColorMode
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          {viewMode === 'hsl' 
            ? "Tip: Select an attribute, activate the Target Tool, then drag vertically on the image to adjust mixed colors."
            : `Adjusting ${activeBin.label}: Fine-tune hue, saturation, and luminance for this color range specifically.`}
        </p>
      </div>
    </div>
  );
};

export default HSLPanel;
