import React, { useState, useEffect, useCallback } from 'react';

interface ResizerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    const delta = direction === 'horizontal' ? e.movementX : e.movementY;
    onResize(delta);
  }, [isDragging, direction, onResize]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handlePointerMove, handlePointerUp, direction]);

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`
        relative z-30 group transition-colors duration-300
        ${direction === 'horizontal' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'}
        ${isDragging ? 'bg-[var(--theme-primary)]/20' : 'hover:bg-[var(--theme-primary)]/10'}
        ${className}
      `}
    >
      {/* Thumb hint */}
      <div className={`
        absolute inset-0 flex items-center justify-center pointer-events-none
      `}>
        <div className={`
          bg-[var(--theme-primary)] rounded-full transition-all duration-300
          ${direction === 'horizontal' ? 'w-0.5 h-8' : 'h-0.5 w-8'}
          ${isDragging 
            ? 'opacity-100 scale-y-125' 
            : 'opacity-30 group-hover:opacity-100 group-hover:scale-y-110'}
        `} />
      </div>
    </div>
  );
};

export default Resizer;
