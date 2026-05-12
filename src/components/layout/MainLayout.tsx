import React from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import BottomPanel from './BottomPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] select-none">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/20">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <BottomPanel />
        </main>
        
        <RightSidebar />
      </div>
    </div>
  );
};

export default MainLayout;
