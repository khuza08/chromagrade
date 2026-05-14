import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import BottomPanel from './BottomPanel';
import Resizer from '../ui/Resizer';
import type { RootState } from '../../store/store';
import { setLeftSidebarWidth, setRightSidebarWidth, setBottomPanelHeight } from '../../store/slices/uiSlice';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { leftSidebarWidth, rightSidebarWidth, bottomPanelHeight } = useSelector((state: RootState) => state.ui);

  const handleLeftResize = (delta: number) => {
    const newWidth = Math.max(150, Math.min(500, leftSidebarWidth + delta));
    dispatch(setLeftSidebarWidth(newWidth));
  };

  const handleRightResize = (delta: number) => {
    const newWidth = Math.max(150, Math.min(500, rightSidebarWidth - delta));
    dispatch(setRightSidebarWidth(newWidth));
  };

  const handleBottomResize = (delta: number) => {
    const newHeight = Math.max(100, Math.min(600, bottomPanelHeight - delta));
    dispatch(setBottomPanelHeight(newHeight));
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] select-none">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <Resizer direction="horizontal" onResize={handleLeftResize} className="border-r border-[var(--border)]" />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/20">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <Resizer direction="vertical" onResize={handleBottomResize} className="border-t border-[var(--border)]" />
          <BottomPanel />
        </main>
        
        <Resizer direction="horizontal" onResize={handleRightResize} className="border-l border-[var(--border)]" />
        <RightSidebar />
      </div>
    </div>
  );
};

export default MainLayout;
