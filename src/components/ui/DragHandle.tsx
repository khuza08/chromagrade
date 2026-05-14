import React from 'react';

interface DragHandleProps {
  direction: 'horizontal' | 'vertical';
}

const DragHandle: React.FC<DragHandleProps> = ({ direction }) => {
  // If the resizer is controlling horizontal width (like a sidebar), 
  // the divider sits vertically, so the pill should be vertical.
  const isVerticalPill = direction === 'horizontal';

  return (
    <div className={`
      flex items-center justify-center gap-[2px] p-1 bg-[var(--bg-panel)] rounded-full
      border border-[var(--border)]
      ${isVerticalPill ? 'flex-col' : 'flex-row'}
    `}>
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="w-[3px] h-[3px] rounded-full bg-[var(--text-secondary)] opacity-60"
        />
      ))}
    </div>
  );
};

export default DragHandle;
