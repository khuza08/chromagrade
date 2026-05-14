import React, { useState, useEffect, useCallback, useRef } from 'react';
import DragHandle from './DragHandle';

interface ResizerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize, onResizeEnd, className = '' }) => {
  const [isActive, setIsActive] = useState(false);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = false;
    setIsActive(true);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current && e.buttons === 1) {
      isDragging.current = true;
    }
    
    if (isDragging.current) {
      const delta = direction === 'horizontal' ? e.movementX : e.movementY;
      onResize(delta);
    }
  }, [direction, onResize]);

  const handlePointerUp = useCallback(() => {
    if (isDragging.current) {
      onResizeEnd?.();
    }
    isDragging.current = false;
    setIsActive(false);
  }, [onResizeEnd]);

  useEffect(() => {
    if (isActive) {
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
  }, [isActive, handlePointerMove, handlePointerUp, direction]);

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`
        relative z-30 group transition-colors duration-300 flex items-center justify-center
        ${direction === 'horizontal' ? 'w-2 cursor-col-resize h-full' : 'h-2 cursor-row-resize w-full'}
        ${isActive ? 'bg-[var(--theme-primary)]/10' : 'hover:bg-[var(--theme-primary)]/5'}
        ${className}
      `}
      style={{ touchAction: 'none' }}
    >
      <DragHandle direction={direction} />
    </div>
  );
};

export default Resizer;
