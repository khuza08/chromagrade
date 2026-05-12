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

// The ring sits at inset-[-6px] from the wheel div, so its radius
// in px = (wheelDivWidth / 2) + 6. We store this as a named constant
// so hit-detection and rendering always agree.
const RING_INSET_PX = 6;

const ColorWheel: React.FC<ColorWheelProps> = ({ label, value, onChange, onReset }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeControl, setActiveControl] = useState<'puck' | 'ring' | 'thumb' | null>(null);

  const SNAP_LIMIT = 0.04; // 4% Magnetic zone

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const distance = Math.sqrt(x * x + y * y);
    const innerRadius = rect.width / 2;
    const ringRadius = innerRadius + RING_INSET_PX; // true ring radius in px

    // Thumb hit detection — must use ringRadius to match where the thumb is rendered
    const lumaAngle = (value.luma - 1.0) * Math.PI;
    const tx = Math.sin(lumaAngle) * ringRadius;
    const ty = -Math.cos(lumaAngle) * ringRadius;
    const thumbDist = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2);

    if (thumbDist < 15) {
      setActiveControl('thumb');
    } else if (distance > innerRadius - 15 && distance < ringRadius + 15) {
      // Ring zone: from 15px inside the wheel edge to 15px outside the ring
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
      const dx = (e.movementX / centerX) * sensitivity;
      const dy = (e.movementY / centerY) * sensitivity;
      let newX = value.x + dx;
      let newY = value.y + dy;
      const magnitude = Math.sqrt(newX * newX + newY * newY);

      if (magnitude < SNAP_LIMIT) {
        newX = 0;
        newY = 0;
      } else if (magnitude > 1.0) {
        newX /= magnitude;
        newY /= magnitude;
      }
      onChange({ x: newX, y: newY });
    } else if (activeControl === 'ring') {
      const dy = (-e.movementY / centerY) * sensitivity;
      onChange({ luma: Math.max(0, Math.min(2, value.luma + dy)) });
    } else if (activeControl === 'thumb') {
      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;
      const angle = Math.atan2(x, -y); // angle from top, clockwise
      const newLuma = 1.0 + angle / Math.PI; // maps [-PI,PI] → [0, 2]
      onChange({ luma: Math.max(0, Math.min(2, newLuma)) });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setActiveControl(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const isSnapped = Math.sqrt(value.x * value.x + value.y * value.y) < 0.001;

  // Thumb angular position on the ring.
  // luma=1.0 → top (angle=0), luma=0 → bottom-left (angle=-PI), luma=2 → bottom-right (angle=+PI)
  const lumaAngle = (value.luma - 1.0) * Math.PI; // range: -PI to +PI

  // Thumb is on the ring which sits RING_INSET_PX outside the wheel div.
  // Express as CSS calc so px offset and % offset compose correctly.
  // sin/cos give unit-vector components; multiply by 50% for the inner radius,
  // then add RING_INSET_PX for the ring protrusion.
  const thumbSinA = Math.sin(lumaAngle);
  const thumbCosA = Math.cos(lumaAngle);
  // left/top position of the thumb centre (half of 12px thumb = 6px offset)
  const thumbLeft = `calc(50% + ${thumbSinA * 50}% + ${thumbSinA * RING_INSET_PX}px)`;
  const thumbTop = `calc(50% + ${-thumbCosA * 50}% + ${-thumbCosA * RING_INSET_PX}px)`;

  // SVG progress ring — use explicit viewBox + circumference maths instead of %-based dash.
  // The SVG is sized to the wheel div plus the ring inset on all sides:
  //   SVG side  = wheelDiv + 2 * RING_INSET_PX
  // With the wheel div being w-36 = 144px:
  //   SVG side  = 144 + 12 = 156px
  //   SVG r     = 156/2 - strokeWidth/2 = 78 - 1.5 = 76.5px
  // We use a viewBox of "0 0 156 156" and r=76.5 so it scales with the component.
  const svgSize = 156; // matches w-36 (144px) + 2*6px
  const strokeWidth = 3;
  const circleR = svgSize / 2 - strokeWidth / 2; // 76.5
  const circumference = 2 * Math.PI * circleR;   // ≈ 480.66px
  const dashOffset = circumference * (1 - value.luma / 2);

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

        {/* Persistent Luma Ring track */}
        <div className="absolute inset-[-6px] rounded-full border border-[var(--border)] opacity-30 pointer-events-none" />

        {/* SVG progress arc — uses explicit viewBox + circumference so dash units are correct */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none"
          style={{ transform: 'rotate(90deg)' }} // rotate so 0% starts at top
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={circleR}
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-75"
            style={{ opacity: 0.4 }}
          />
        </svg>

        {/* Luma Thumb — positioned on the ring via calc() */}
        <div
          className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md transition-transform duration-75 z-20
            ${(activeControl === 'ring' || activeControl === 'thumb') ? 'bg-[var(--accent-blue)] scale-125' : 'bg-[var(--bg-control)]'}`}
          style={{
            left: thumbLeft,
            top: thumbTop,
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
          }}
        />

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[1px] h-full bg-[var(--text-tertiary)]" />
          <div className="h-[1px] w-full bg-[var(--text-tertiary)] absolute" />
        </div>

        {/* The Puck */}
        <div
          className={`absolute w-4 h-4 rounded-full border-2 shadow-lg transition-transform duration-75 pointer-events-none
            ${isSnapped
              ? 'border-[var(--text-tertiary)] bg-transparent'
              : 'border-white bg-[var(--accent-blue)] shadow-[0_0_15px_var(--accent-blue)]'}`}
          style={{
            left: `${(value.x + 1) * 50}%`,
            top: `${(value.y + 1) * 50}%`,
            transform: `translate(-50%, -50%) ${isDragging && activeControl === 'puck' ? 'scale(1.2)' : 'scale(1)'}`,
          }}
        />

        {/* Luma Value Tooltip */}
        {isDragging && (activeControl === 'ring' || activeControl === 'thumb') && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] border border-[var(--border)] px-2 py-1 rounded text-[9px] font-mono text-[var(--accent-blue)] shadow-xl z-30">
            LUMA: {value.luma.toFixed(2)}
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