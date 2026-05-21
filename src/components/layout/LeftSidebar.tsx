import React from 'react';
import { Layers, Image, History, Bookmark } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import EmptyStateOverlay from '../ui/EmptyStateOverlay';
import { applyPartialSnapshot } from '../../store/slices/gradingSlice';

const LeftSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl), (a, b) => a === b);
  const prebuiltPresets = useSelector((state: RootState) => state.presets.prebuiltPresets);
  const userPresets = useSelector((state: RootState) => state.presets.userPresets);
  const allPresets = [...userPresets, ...prebuiltPresets];

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
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] font-bold text-white">Apply</span>
                </div>
                <div className="absolute bottom-1 left-1 right-1">
                  <span className="text-[9px] font-semibold text-white/70 truncate block px-1">{preset.name}</span>
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
