import React, { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import BottomPanel from './BottomPanel';
import Resizer from '../ui/Resizer';
import type { RootState } from '../../store/store';
import { setLeftSidebarWidth, setRightSidebarWidth, setBottomPanelHeight } from '../../store/slices/uiSlice';

const MIN_LEFT = 150;
const MAX_LEFT = 500;
const MIN_RIGHT = 150;
const MAX_RIGHT = 500;
const MIN_BOTTOM = 100;
const MAX_BOTTOM = 600;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  
  // Seed refs from initial Redux state
  const initialLeft = useSelector((state: RootState) => state.ui.leftSidebarWidth);
  const initialRight = useSelector((state: RootState) => state.ui.rightSidebarWidth);
  const initialBottom = useSelector((state: RootState) => state.ui.bottomPanelHeight);
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl));

  const leftWidthRef = useRef(initialLeft);
  const rightWidthRef = useRef(initialRight);
  const bottomHeightRef = useRef(initialBottom);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLeftResize = useCallback((delta: number) => {
    const next = Math.min(Math.max(leftWidthRef.current + delta, MIN_LEFT), MAX_LEFT);
    leftWidthRef.current = next;
    containerRef.current?.style.setProperty('--left-sidebar-width', `${next}px`);
  }, []);

  const handleLeftResizeEnd = useCallback(() => {
    dispatch(setLeftSidebarWidth(leftWidthRef.current));
  }, [dispatch]);

  const handleRightResize = useCallback((delta: number) => {
    const next = Math.min(Math.max(rightWidthRef.current - delta, MIN_RIGHT), MAX_RIGHT);
    rightWidthRef.current = next;
    containerRef.current?.style.setProperty('--right-sidebar-width', `${next}px`);
  }, []);

  const handleRightResizeEnd = useCallback(() => {
    dispatch(setRightSidebarWidth(rightWidthRef.current));
  }, [dispatch]);

  const handleBottomResize = useCallback((delta: number) => {
    const next = Math.min(Math.max(bottomHeightRef.current - delta, MIN_BOTTOM), MAX_BOTTOM);
    bottomHeightRef.current = next;
    containerRef.current?.style.setProperty('--bottom-panel-height', `${next}px`);
  }, []);

  const handleBottomResizeEnd = useCallback(() => {
    dispatch(setBottomPanelHeight(bottomHeightRef.current));
  }, [dispatch]);

  return (
    <div 
      ref={containerRef}
      className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] select-none"
      style={{
        '--left-sidebar-width': `${initialLeft}px`,
        '--right-sidebar-width': `${initialRight}px`,
        '--bottom-panel-height': `${initialBottom}px`,
      } as React.CSSProperties}
    >
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <Resizer 
          direction="horizontal" 
          onResize={handleLeftResize} 
          onResizeEnd={handleLeftResizeEnd}
          className="border-r border-[var(--border)]" 
          disabled={!hasImage}
        />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/20">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <Resizer 
            direction="vertical" 
            onResize={handleBottomResize} 
            onResizeEnd={handleBottomResizeEnd}
            className="border-t border-[var(--border)]" 
            disabled={!hasImage}
          />
          <BottomPanel />
        </main>
        
        <Resizer 
          direction="horizontal" 
          onResize={handleRightResize} 
          onResizeEnd={handleRightResizeEnd}
          className="border-l border-[var(--border)]" 
          disabled={!hasImage}
        />
        <RightSidebar />
      </div>
    </div>
  );
};

export default MainLayout;
