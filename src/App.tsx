import MainLayout from './components/layout/MainLayout';
import CanvasViewer from './components/viewer/CanvasViewer';
import ExportModal from './components/export/ExportModal';

function App() {
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
