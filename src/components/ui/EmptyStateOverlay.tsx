import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const EmptyStateOverlay: React.FC = () => {
  const hasImage = useSelector(
    (state: RootState) => Boolean(state.image.originalUrl),
    (a, b) => a === b
  );

  if (hasImage) return null;

  return (
    <div
      className="absolute inset-0 z-50 cursor-not-allowed"
      style={{
        backdropFilter: 'blur(2px)',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    />
  );
};

export default EmptyStateOverlay;
