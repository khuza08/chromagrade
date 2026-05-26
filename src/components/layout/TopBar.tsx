import React, { useRef } from 'react';
import { Undo2, Redo2, RotateCcw, Download, PanelLeftOpen, PanelLeftClose, Wand2, Save, FolderOpen, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { undo, redo, resetHistory } from '../../store/slices/historySlice';
import { applySnapshot, resetGrading } from '../../store/slices/gradingSlice';
import { applyBasicSnapshot, resetBasic } from '../../store/slices/basicSlice';
import { setExportModalOpen, toggleLeftSidebar, resetViewport } from '../../store/slices/uiSlice';
import { openModal } from '../../store/slices/colorTransferSlice';
import { setImage, clearImage } from '../../store/slices/imageSlice';
import { canvasEngine } from '../../lib/CanvasEngine';
import { saveWorkspace, loadWorkspace, workspaceToObjectUrl } from '../../utils/workspaceIO';

const TopBar: React.FC = () => {
  const dispatch = useDispatch();
  const { past, future } = useSelector((state: RootState) => state.history);
  const currentGrading = useSelector((state: RootState) => state.grading);
  const currentBasic = useSelector((state: RootState) => state.basic);
  const hasImage = useSelector((state: RootState) => Boolean(state.image.originalUrl));
  const originalUrl = useSelector((state: RootState) => state.image.originalUrl);
  const fileName = useSelector((state: RootState) => state.image.fileName);
  const workspaceInputRef = useRef<HTMLInputElement>(null);
  const leftCollapsed = useSelector((state: RootState) => state.ui.leftSidebarCollapsed);

  const handleUndo = () => {
    if (past.length > 0) {
      const prev = past[past.length - 1];
      dispatch(undo(currentGrading));
      dispatch(applySnapshot(prev));
    }
  };

  const handleRedo = () => {
    if (future.length > 0) {
      const next = future[0];
      dispatch(redo(currentGrading));
      dispatch(applySnapshot(next));
    }
  };

  const handleSaveWorkspace = async () => {
    if (!originalUrl || !fileName) return;
    try {
      await saveWorkspace(originalUrl, fileName, currentGrading, currentBasic);
    } catch (err) {
      console.error('Failed to save workspace:', err);
    }
  };

  const handleLoadWorkspace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const workspace = await loadWorkspace(file);
      const url = workspaceToObjectUrl(workspace);
      const dimensions = await canvasEngine.loadImage(url);
      dispatch(setImage({ url, width: dimensions.width, height: dimensions.height, name: workspace.fileName }));
      dispatch(applySnapshot(workspace.gradingState));
      if (workspace.basicState) dispatch(applyBasicSnapshot(workspace.basicState));
      dispatch(resetHistory());
      dispatch(resetViewport());
      canvasEngine.render(workspace.gradingState);
    } catch (err: any) {
      alert(err.message || 'Failed to load workspace');
    }
  };

  return (
    <div className="h-12 bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button onClick={() => dispatch(toggleLeftSidebar())} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)]">
          {leftCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <h1 className="text-sm font-bold tracking-tight text-[var(--theme-primary)]">
          ChromaGrade
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUndo}
          disabled={past.length === 0 || !hasImage}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={handleRedo}
          disabled={future.length === 0 || !hasImage}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={handleSaveWorkspace}
          disabled={!hasImage}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--text-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Save Workspace"
        >
          <Save size={14} />
          Save
        </button>
        <button
          onClick={() => workspaceInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--text-secondary)] transition-colors"
          title="Load Workspace"
        >
          <FolderOpen size={14} />
          Load
        </button>
        <input
          ref={workspaceInputRef}
          type="file"
          accept=".chromagrade-workspace"
          className="hidden"
          onChange={handleLoadWorkspace}
        />
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={() => dispatch(openModal(currentGrading))}
          disabled={!hasImage}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--text-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Match Color"
        >
          <Wand2 size={14} />
          Match Color
        </button>
        <button
          onClick={() => { dispatch(resetGrading()); dispatch(resetBasic()); dispatch(resetHistory()); }}
          disabled={!hasImage}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--text-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <button
          onClick={() => {
            if (!confirm('Clear the workspace? This will remove the current image and all grading.')) return;
            canvasEngine.clearImage();
            dispatch(clearImage());
            dispatch(resetGrading());
            dispatch(resetHistory());
          }}
          disabled={!hasImage}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--accent-red,#f87171)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear image"
        >
          <X size={14} />
          Clear
        </button>
      </div>

      <div className="flex items-center">
        <button
          onClick={() => dispatch(setExportModalOpen(true))}
          disabled={!hasImage}
          className="flex items-center gap-2 bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-white px-4 py-1.5 rounded text-xs font-semibold transition-all shadow-lg shadow-black/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
};

export default TopBar;
