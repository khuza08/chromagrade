import React, { useEffect, useRef, useState } from 'react';
import { Layers, Image, History, Bookmark } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import EmptyStateOverlay from '../ui/EmptyStateOverlay';
import { applyPartialSnapshot } from '../../store/slices/gradingSlice';
import { CanvasEngine } from '../../lib/CanvasEngine';
import type { GradingState } from '../../store/slices/gradingSlice';

// Neutral base grading state for preset previews
const neutralGrading: GradingState = {
  primary: {
    shadows:    { x: 0, y: 0, luma: 1 },
    midtones:   { x: 0, y: 0, luma: 1 },
    highlights: { x: 0, y: 0, luma: 1 },
    global:     { x: 0, y: 0, luma: 1 },
  },
  contrast: 0, pivot: 0.5, saturation: 0,
  temperature: 0, tint: 0, vibrance: 0,
  curves: {
    master: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    red:    [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    green:  [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    blue:   [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  },
  hsl: {
    red: { h: 0, s: 0, l: 0 }, orange: { h: 0, s: 0, l: 0 },
    yellow: { h: 0, s: 0, l: 0 }, green: { h: 0, s: 0, l: 0 },
    aqua: { h: 0, s: 0, l: 0 }, blue: { h: 0, s: 0, l: 0 },
    purple: { h: 0, s: 0, l: 0 }, magenta: { h: 0, s: 0, l: 0 },
  },
};

const LeftSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl), (a, b) => a === b);
  const prebuiltPresets = useSelector((state: RootState) => state.presets.prebuiltPresets);
  const userPresets = useSelector((state: RootState) => state.presets.userPresets);
  const originalUrl = useSelector((state: RootState) => state.image.originalUrl);
  const allPresets = [...userPresets, ...prebuiltPresets];

  const [previews, setPreviews] = useState<Record<string, string>>({});
  const engineRef = useRef<CanvasEngine | null>(null);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!originalUrl || allPresets.length === 0) {
      setPreviews({});
      return;
    }

    // Create offscreen canvas once
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement('canvas');
      offscreenCanvas.current.width = 160;
      offscreenCanvas.current.height = 90;
    }

    if (!engineRef.current) {
      engineRef.current = new CanvasEngine();
      engineRef.current.init(offscreenCanvas.current);
    }

    const engine = engineRef.current;
    const canvas = offscreenCanvas.current;

    engine.loadImage(originalUrl).then(() => {
      const newPreviews: Record<string, string> = {};

      for (const preset of allPresets) {
        const params: GradingState = { ...neutralGrading, ...preset.parameters } as GradingState;
        engine.updateCurveTextures(params.curves);
        engine.updateHslTextures(params.hsl);
        engine.render(params);
        newPreviews[preset.id] = canvas.toDataURL('image/jpeg', 0.7);
      }

      setPreviews(newPreviews);
    });

    return () => {
      if (engineRef.current) {
        engineRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, allPresets.length]);

  return (
    <div 
      className="relative bg-[var(--bg-panel)] border-[var(--border)] flex flex-col transition-all duration-300 overflow-hidden"
      style={{ width: 'var(--left-sidebar-width)' }}
      {...(!hasImage ? { inert: true } : {})}
    >
      <EmptyStateOverlay />
      <div className="flex-1 overflow-y-auto">
        <section className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark size={16} className="text-[var(--theme-primary)]" />
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-[var(--text-secondary)] hidden lg:block">
              Presets
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {allPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => dispatch(applyPartialSnapshot(preset.parameters))}
                className="aspect-video bg-[var(--bg-control)] rounded border border-[var(--border)] hover:border-[var(--theme-primary)] cursor-pointer overflow-hidden relative group"
                style={previews[preset.id] ? {
                  backgroundImage: `url(${previews[preset.id]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : undefined}
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-2 pt-6 pb-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <span className="text-[9px] font-semibold text-white truncate block">{preset.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <Image size={16} className="text-[var(--text-secondary)]" />
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-[var(--text-secondary)] hidden lg:block">
              LUT Manager
            </h2>
          </div>
          <div className="space-y-1">
            {['Cinematic', 'Vintage', 'Muted'].map((lut) => (
              <div key={lut} className="px-2 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)] cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden lg:block">
                {lut}
              </div>
            ))}
            <div className="lg:hidden flex flex-col items-center gap-4 py-2">
              <Layers size={18} className="text-[var(--text-secondary)]" />
              <History size={18} className="text-[var(--text-secondary)]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LeftSidebar;
