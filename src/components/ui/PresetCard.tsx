import React from 'react';
import type { Preset } from '../../store/slices/presetsSlice';
import { Trash2 } from 'lucide-react';

interface PresetCardProps {
  preset: Preset;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete?: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, isSelected, onClick, onDelete }) => {
  return (
    <div 
      className={`relative group bg-[var(--bg-base)] hover:bg-[var(--bg-control)] border transition-all flex flex-col justify-between h-[80px] w-full min-w-[120px] max-w-[160px] shadow-sm select-none cursor-pointer rounded-lg p-3.5 ${
        isSelected 
          ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 ring-1 ring-[var(--theme-primary)]' 
          : 'border-[var(--border)] hover:border-[var(--theme-primary)]/40'
      }`}
      onClick={onClick}
    >
      <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight truncate pr-4">
        {preset.name}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
        {preset.category}
      </span>
      
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          title="Delete Custom Preset"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

export default PresetCard;
