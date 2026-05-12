import React, { useRef, useState } from 'react';

interface WheelValue {
  x: number;
  y: number;
  luma: number;
}

interface ColorWheelProps {
  label: string;
  value: WheelValue;
  onChange: (value: Partial<WheelValue>) => void;
  onReset?: () => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ label, value, onChange, onReset }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeControl, setActiveControl] = useState<'puck' | 'ring' | null>(null);

  const SNAP_LIMIT = 0.04; // 4% Magnetic zone

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const distance = Math.sqrt(x * x + y * y);
    const radius = rect.width / 2;

    // Detect if clicking ring (outer 15% of radius) or puck (inner area)
    if (distance > radius - 15 && distance < radius + 15) {
      setActiveControl('ring');
    } else {
      setActiveControl('puck');
    }

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !activeControl) return;

    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const sensitivity = e.shiftKey ? 0.25 : 1.0;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (activeControl === 'puck') {
      // Calculate delta from current position scaled by sensitivity
      // This allows infinite precision regardless of screen resolution
      const dx = e.movementX / centerX * sensitivity;
      const dy = e.movementY / centerY * sensitivity;

      let newX = value.x + dx;
      let newY = value.y + dy;

      // Magnitude check for snapping and clamping
      const magnitude = Math.sqrt(newX * newX + newY * newY);
      
      if (magnitude < SNAP_LIMIT) {
        newX = 0;
        newY = 0;
      } else if (magnitude > 1.0) {
        // Clamp to circle
        newX /= magnitude;
        newY /= magnitude;
      }

      onChange({ x: newX, y: newY });
    } else if (activeControl === 'ring') {
      // Linear vertical drag for luma ring
      const dy = -e.movementY / centerY * sensitivity;
      const newLuma = Math.max(0, Math.min(2, value.luma + dy));
      onChange({ luma: newLuma });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setActiveControl(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const isSnapped = Math.sqrt(value.x * value.x + value.y * value.y) < 0.001;

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={onReset}
        className="w-36 h-36 rounded-full border border-[var(--border)] bg-[conic-gradient(from_0deg,yellow,orange,red,magenta,blue,cyan,lime,yellow)] bg-opacity-10 relative group cursor-crosshair shadow-inner"
        style={{ touchAction: 'none' }}
      >
        {/* Soft overlay to desaturate the background gradient */}
        <div className="absolute inset-0 rounded-full bg-[var(--bg-panel)] opacity-80 pointer-events-none" />
        
        {/* Luminance Ring Glow */}
        <div 
          className="absolute inset-[-4px] rounded-full border-2 transition-colors duration-300 pointer-events-none"
          style={{ 
            borderColor: value.luma !== 1.0 ? 'var(--accent-blue)' : 'var(--bg-control)',
            opacity: Math.abs(value.luma - 1.0) * 0.5 + 0.2
          }}
        />

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[1px] h-full bg-[var(--text-tertiary)]" />
          <div className="h-[1px] w-full bg-[var(--text-tertiary)] absolute" />
        </div>

        {/* The Puck */}
        <div 
          className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 shadow-lg transition-transform duration-75 pointer-events-none
            ${isSnapped 
              ? 'border-[var(--text-tertiary)] bg-transparent' 
              : 'border-white bg-[var(--accent-blue)] shadow-[0_0_15px_var(--accent-blue)]'}`}
          style={{ 
            left: `${(value.x + 1) * 50}%`, 
            top: `${(value.y + 1) * 50}%`,
            transform: isDragging ? 'scale(1.2)' : 'scale(1)'
          }}
        />

        {/* Luma Value Indicator (Tooltip style) */}
        {isDragging && activeControl === 'ring' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] border border-[var(--border)] px-2 py-1 rounded text-[9px] font-mono text-[var(--accent-blue)]">
            {value.luma.toFixed(2)}
          </div>
        )}
      </div>
      
      <div 
        className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
        onDoubleClick={onReset}
      >
        {label}
      </div>
    </div>
  );
};

export default ColorWheel;
