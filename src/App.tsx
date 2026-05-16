import MainLayout from './components/layout/MainLayout';
import CanvasViewer from './components/viewer/CanvasViewer';
import ExportModal from './components/export/ExportModal';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import { usePreventUnload } from './hooks/usePreventUnload';

function App() {
  const originalUrl = useSelector((state: RootState) => state.image.originalUrl);
  usePreventUnload(!!originalUrl);

  return (
    <>
      <MainLayout>
        <CanvasViewer />
      </MainLayout>
      <ExportModal />
    </>
  );
}

export default App;
