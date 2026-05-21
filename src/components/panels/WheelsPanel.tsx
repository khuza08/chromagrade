import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  setContrast, 
  setSaturation, 
  setTemperature, 
  setTint, 
  setVibrance,
  setPrimaryWheel, 
  resetPrimaryWheel
} from '../../store/slices/gradingSlice';
import type { PrimaryWheels } from '../../store/slices/gradingSlice';
import PerformanceSlider from '../ui/PerformanceSlider';
import ColorWheel from '../ui/ColorWheel';

const WheelsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const grading = useSelector((state: RootState) => state.grading);

  const wheelConfigs: { key: keyof PrimaryWheels; label: string }[] = [
    { key: 'shadows', label: 'Shadows' },
    { key: 'midtones', label: 'Midtones' },
    { key: 'highlights', label: 'Highlights' },
    { key: 'global', label: 'Global' },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4">
      {/* Primary Wheels */}
      <div className="flex-1 flex justify-around items-center px-4">
        {wheelConfigs.map((config) => (
          <ColorWheel 
            key={config.key}
            label={config.label}
            value={grading.primary[config.key]}
            onChange={(val) => dispatch(setPrimaryWheel({ wheel: config.key, ...val }))}
            onReset={() => dispatch(resetPrimaryWheel(config.key))}
          />
        ))}
      </div>

      {/* Sliders Grid */}
      <div className="h-24 flex gap-x-4 px-8 border-t border-[var(--border)]/30 pt-2 overflow-x-auto">
        <PerformanceSlider 
          label="Contrast" 
          min={-100} max={100} 
          value={grading.contrast} 
          onChange={(v) => dispatch(setContrast(v))} 
          onReset={() => dispatch(setContrast(0))}
        />
        <PerformanceSlider 
          label="Saturation" 
          min={-100} max={100} 
          value={grading.saturation} 
          onChange={(v) => dispatch(setSaturation(v))} 
          onReset={() => dispatch(setSaturation(0))}
        />
        <PerformanceSlider 
          label="Temperature" 
          min={-100} max={100} 
          value={grading.temperature} 
          onChange={(v) => dispatch(setTemperature(v))} 
          onReset={() => dispatch(setTemperature(0))}
        />
        <PerformanceSlider 
          label="Tint" 
          min={-100} max={100} 
          value={grading.tint} 
          onChange={(v) => dispatch(setTint(v))} 
          onReset={() => dispatch(setTint(0))}
        />
        <PerformanceSlider 
          label="Vibrance" 
          min={-100} max={100} 
          value={grading.vibrance} 
          onChange={(v) => dispatch(setVibrance(v))} 
          onReset={() => dispatch(setVibrance(0))} 
        />
      </div>
    </div>
  );
};

export default WheelsPanel;
