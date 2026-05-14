import React, { useMemo } from 'react';
import { BarChart2, Activity, Target } from 'lucide-react';

const RightSidebar: React.FC = () => {
  const width = 'var(--right-sidebar-width)';

  // Memoize the random heights so they don't jitter during resize re-renders
  const histogramData = useMemo(() => 
    [...Array(32)].map(() => Math.random() * 100), 
  []);

  return (
    <div 
      className="bg-[var(--bg-panel)] border-[var(--border)] flex flex-col transition-all duration-300 overflow-hidden"
      style={{ width }}
    >
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-[var(--text-secondary)] hidden lg:block">
          Scopes
        </h2>
        <div className="flex gap-2">
           <Activity size={14} className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]" />
           <Target size={14} className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">Histogram</span>
            <BarChart2 size={12} className="text-[var(--text-secondary)]" />
          </div>
          <div className="h-32 bg-[var(--bg-control)] rounded border border-[var(--border)] flex items-end p-1 gap-[1px]">
            {histogramData.map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-gray-600 to-gray-400 opacity-50" 
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">Parade</span>
            <Activity size={12} className="text-[var(--text-secondary)]" />
          </div>
          <div className="h-32 bg-[var(--bg-control)] rounded border border-[var(--border)] flex items-center justify-center p-2 gap-2">
             <div className="flex-1 h-full flex items-end gap-[1px]">
                {[...Array(12)].map((_, i) => <div key={i} className="flex-1 bg-[var(--curve-r)] opacity-30" style={{height: '60%'}} />)}
             </div>
             <div className="flex-1 h-full flex items-end gap-[1px]">
                {[...Array(12)].map((_, i) => <div key={i} className="flex-1 bg-[var(--curve-g)] opacity-30" style={{height: '40%'}} />)}
             </div>
             <div className="flex-1 h-full flex items-end gap-[1px]">
                {[...Array(12)].map((_, i) => <div key={i} className="flex-1 bg-[var(--curve-b)] opacity-30" style={{height: '70%'}} />)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
