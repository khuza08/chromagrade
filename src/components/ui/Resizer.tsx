import React, { useState, useEffect, useCallback } from 'react';
import DragHandle from './DragHandle';

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
        relative z-30 group transition-colors duration-300 flex items-center justify-center
        ${direction === 'horizontal' ? 'w-2 cursor-col-resize h-full' : 'h-2 cursor-row-resize w-full'}
        ${isDragging ? 'bg-[var(--theme-primary)]/10' : 'hover:bg-[var(--theme-primary)]/5'}
        ${className}
      `}
    >
      <DragHandle direction={direction} />
    </div>
  );
};

export default Resizer;
