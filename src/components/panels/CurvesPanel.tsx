import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { resetCurve, setCurvePoints } from '../../store/slices/gradingSlice';
import type { CurvesState } from '../../store/slices/gradingSlice';
import { setPickerActive, setActiveCurveChannel } from '../../store/slices/uiSlice';
import { RotateCcw, Copy, Target } from 'lucide-react';
import CurveGraph from '../ui/CurveGraph';
import { canvasEngine } from '../../lib/CanvasEngine';
import { histogramGenerator } from '../../lib/HistogramGenerator';
import type { HistogramData } from '../../lib/HistogramGenerator';

const CurvesPanel: React.FC = () => {
  const dispatch = useDispatch();
  const curves = useSelector((state: RootState) => state.grading.curves);
  const isPickerActive = useSelector((state: RootState) => state.ui.isPickerActive);
  const activeChannel = useSelector((state: RootState) => state.ui.activeCurveChannel);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

  // Periodic Histogram Update
  useEffect(() => {
    const updateHistogram = () => {
      const canvas = canvasEngine.getCanvas();
      if (canvas) {
        const data = histogramGenerator.generate(canvas);
        setHistogramData(data);
      }
    };

    const interval = setInterval(updateHistogram, 200); // 5fps for histogram is enough
    updateHistogram();
    
    return () => clearInterval(interval);
  }, []);

  const channels: { id: keyof CurvesState; label: string; color: string }[] = [
    { id: 'master', label: 'RGB', color: 'var(--text-primary)' },
    { id: 'red', label: 'Red', color: '#ef4444' },
    { id: 'green', label: 'Green', color: '#22c55e' },
    { id: 'blue', label: 'Blue', color: '#3b82f6' },
  ];

  const handleCopyMasterToChannels = () => {
    const masterPoints = curves.master;
    ['red', 'green', 'blue'].forEach(ch => {
      dispatch(setCurvePoints({ channel: ch as keyof CurvesState, points: [...masterPoints] }));
    });
  };

  return (
    <div className="flex h-full bg-[var(--bg-panel)] p-4 gap-6">
      {/* Left: Curve Graph */}
      <div className="flex-1 flex flex-col gap-4 max-w-[400px]">
        <div className="flex items-center justify-between">
          <div className="flex bg-[var(--bg-base)] rounded-md p-0.5 border border-[var(--border)]">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => dispatch(setActiveCurveChannel(ch.id))}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-[4px] ${
                  activeChannel === ch.id 
                    ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" 
                  style={{ backgroundColor: ch.color, opacity: activeChannel === ch.id ? 1 : 0.4 }} 
                />
                {ch.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
             <button
              onClick={() => dispatch(setPickerActive(!isPickerActive))}
              className={`p-1.5 rounded-md transition-all border ${
                isPickerActive 
                  ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' 
                  : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Targeted Adjustment Tool"
            >
              <Target size={14} />
            </button>
            <button
              onClick={() => dispatch(resetCurve(activeChannel))}
              className="p-1.5 bg-[var(--bg-base)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Reset Current Curve"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="aspect-square bg-black/40 rounded-lg border border-[var(--border)] relative overflow-hidden group">
           <CurveGraph 
            channel={activeChannel} 
            points={curves[activeChannel]} 
            isPickerActive={isPickerActive}
            histogramData={histogramData}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest px-1">
          <span>Blacks</span>
          <span>Midtones</span>
          <span>Whites</span>
        </div>
      </div>

      {/* Right: Controls & Info */}
      <div className="w-48 flex flex-col gap-4">
        <div className="bg-[var(--bg-base)] rounded-lg border border-[var(--border)] p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3 text-[var(--text-secondary)]">Utilities</h3>
          <button
            onClick={handleCopyMasterToChannels}
            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-panel)] hover:bg-[var(--bg-control)] rounded-md border border-[var(--border)] text-[11px] transition-all group"
          >
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Copy RGB to All</span>
            <Copy size={12} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        <div className="mt-auto p-3 bg-[var(--accent-blue)]/5 rounded-lg border border-[var(--accent-blue)]/10">
          <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
            Tip: Double-click to add/remove points. Drag close to the diagonal to snap.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurvesPanel;
