import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setContrast, setSaturation, setTemperature, setTint } from '../../store/slices/gradingSlice';
import PerformanceSlider from '../ui/PerformanceSlider';

const WheelsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const grading = useSelector((state: RootState) => state.grading);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4">
      {/* Wheels Placeholder */}
      <div className="flex-1 flex justify-around items-center">
         {['Lift', 'Gamma', 'Gain', 'Offset'].map((wheel) => (
           <div key={wheel} className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-full border-2 border-[var(--border)] bg-gradient-to-tr from-black/40 to-transparent relative group cursor-crosshair">
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] shadow-[0_0_10px_var(--accent-blue)]" />
                 </div>
                 {/* Luminance Ring */}
                 <div className="absolute inset-[-4px] rounded-full border border-[var(--bg-control)]" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter text-[var(--text-secondary)]">{wheel}</span>
           </div>
         ))}
      </div>

      {/* Sliders Grid */}
      <div className="h-24 grid grid-cols-4 gap-x-12 gap-y-4 px-8 border-t border-[var(--border)]/50 pt-6">
        <PerformanceSlider 
          label="Contrast" 
          min={-100} max={100} 
          value={grading.contrast} 
          onChange={(v) => dispatch(setContrast(v))} 
        />
        <PerformanceSlider 
          label="Saturation" 
          min={-100} max={100} 
          value={grading.saturation} 
          onChange={(v) => dispatch(setSaturation(v))} 
        />
        <PerformanceSlider 
          label="Temperature" 
          min={-100} max={100} 
          value={grading.temperature} 
          onChange={(v) => dispatch(setTemperature(v))} 
        />
        <PerformanceSlider 
          label="Tint" 
          min={-100} max={100} 
          value={grading.tint} 
          onChange={(v) => dispatch(setTint(v))} 
        />
      </div>
    </div>
  );
};

export default WheelsPanel;
