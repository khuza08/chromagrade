import React from 'react';
import { Undo2, Redo2, RotateCcw, Download, Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { undo, redo, resetHistory } from '../../store/slices/historySlice';
import { applySnapshot, resetGrading } from '../../store/slices/gradingSlice';
import { setExportModalOpen } from '../../store/slices/uiSlice';

const TopBar: React.FC = () => {
  const dispatch = useDispatch();
  const { past, future } = useSelector((state: RootState) => state.history);
  const currentGrading = useSelector((state: RootState) => state.grading);

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

  const handleReset = () => {
    dispatch(resetGrading());
    dispatch(resetHistory());
  };

  return (
    <div className="h-12 bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)]">
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-tight text-[var(--theme-primary)]">
          ChromaGrade
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handleUndo}
          disabled={past.length === 0}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button 
          onClick={handleRedo}
          disabled={future.length === 0}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button 
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-xs font-medium text-[var(--text-secondary)] transition-colors"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="flex items-center">
        <button 
          onClick={() => dispatch(setExportModalOpen(true))}
          className="flex items-center gap-2 bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-white px-4 py-1.5 rounded text-xs font-semibold transition-all shadow-lg shadow-black/20"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
};

export default TopBar;
