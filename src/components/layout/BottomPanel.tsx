import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setTab } from '../../store/slices/uiSlice';
import { Circle, Activity, Pipette, Palette, Sparkles, Map } from 'lucide-react';
import WheelsPanel from '../panels/WheelsPanel';
import CurvesPanel from '../panels/CurvesPanel';
import HSLPanel from '../panels/HSLPanel';
import EmptyStateOverlay from '../ui/EmptyStateOverlay';

const tabs = [
  { id: 'wheels', label: 'Wheels', icon: Circle },
  { id: 'curves', label: 'Curves', icon: Activity },
  { id: 'hsl', label: 'HSL', icon: Pipette },
  { id: 'lut', label: 'LUT', icon: Palette },
  { id: 'ai', label: 'AI Grade', icon: Sparkles },
  { id: 'presets', label: 'ID Presets', icon: Map },
] as const;

const BottomPanel: React.FC = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state: RootState) => state.ui.activeBottomTab);
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl), (a, b) => a === b);

  return (
    <div 
      className="relative bg-[var(--bg-panel)] border-[var(--border)] flex flex-col"
      style={{ height: 'var(--bottom-panel-height)' }}
      {...(!hasImage ? { inert: true } : {})}
    >
      <EmptyStateOverlay />
      <div className="flex bg-[var(--bg-base)] px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch(setTab(tab.id))}
              className={`
                flex items-center gap-2 px-6 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-t-2
                ${isActive 
                  ? 'bg-[var(--bg-panel)] border-[var(--theme-primary)] text-[var(--text-primary)]' 
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-control)]'}
              `}
            >
              <Icon size={14} className={isActive ? 'text-[var(--theme-primary)]' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'wheels' ? (
          <WheelsPanel />
        ) : activeTab === 'curves' ? (
          <CurvesPanel />
        ) : activeTab === 'hsl' ? (
          <HSLPanel />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-sm italic">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
