import React, { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Resizer from '../ui/Resizer';
import type { RootState } from '../../store/store';
import { setLeftSidebarWidth, setRightSidebarWidth } from '../../store/slices/uiSlice';

const MIN_LEFT = 150;
const MAX_LEFT = 500;
const MIN_RIGHT = 150;
const MAX_RIGHT = 500;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();

  const initialLeft = useSelector((state: RootState) => state.ui.leftSidebarWidth);
  const initialRight = useSelector((state: RootState) => state.ui.rightSidebarWidth);
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl));

  const leftWidthRef = useRef(initialLeft);
  const rightWidthRef = useRef(initialRight);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSidebarCollapsed = useSelector((state: RootState) => state.ui.leftSidebarCollapsed);

  const handleLeftResize = useCallback((delta: number) => {
    const next = Math.min(Math.max(leftWidthRef.current + delta, MIN_LEFT), MAX_LEFT);
    leftWidthRef.current = next;
    containerRef.current?.style.setProperty('--left-sidebar-width', `${next}px`);
  }, []);

  const handleLeftResizeEnd = useCallback(() => {
    dispatch(setLeftSidebarWidth(leftWidthRef.current));
  }, [dispatch]);

  React.useEffect(() => {
    containerRef.current?.style.setProperty(
      '--left-sidebar-width',
      leftSidebarCollapsed ? '0px' : `${leftWidthRef.current}px`
    );
  }, [leftSidebarCollapsed]);

  const handleRightResize = useCallback((delta: number) => {
    const next = Math.min(Math.max(rightWidthRef.current - delta, MIN_RIGHT), MAX_RIGHT);
    rightWidthRef.current = next;
    containerRef.current?.style.setProperty('--right-sidebar-width', `${next}px`);
  }, []);

  const handleRightResizeEnd = useCallback(() => {
    dispatch(setRightSidebarWidth(rightWidthRef.current));
  }, [dispatch]);

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] select-none"
      style={{
        '--left-sidebar-width': `${initialLeft}px`,
        '--right-sidebar-width': `${initialRight}px`,
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
          disabled={!hasImage || leftSidebarCollapsed}
        />

        <main className="flex-1 overflow-hidden">
          {children}
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
