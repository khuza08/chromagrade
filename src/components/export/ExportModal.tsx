import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setExportFormat } from '../../store/slices/exportSlice';
import type { ExportFormat } from '../../store/slices/exportSlice';
import { setExportModalOpen } from '../../store/slices/uiSlice';
import { canvasEngine } from '../../lib/CanvasEngine';
import { Download, X } from 'lucide-react';

const ExportModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isExportModalOpen } = useSelector((state: RootState) => state.ui);
  const { format } = useSelector((state: RootState) => state.export);
  const gradingParams = useSelector((state: RootState) => state.grading);
  const { fileName } = useSelector((state: RootState) => state.image);

  if (!isExportModalOpen) return null;

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setExportFormat(e.target.value as ExportFormat));
  };

  const handleExport = async () => {
    try {
      const blob = await canvasEngine.exportToBlob(gradingParams, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName?.split('.')[0] || 'chromagrade'}_graded.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(setExportModalOpen(false));
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Export Masterpiece</h2>
          <button
            onClick={() => dispatch(setExportModalOpen(false))}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Output Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(['jpg', 'png', 'gif'] as ExportFormat[]).map((f) => (
                <label
                  key={f}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${format === f ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-lg shadow-blue-900/10' : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={f}
                    checked={format === f}
                    onChange={handleFormatChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className={`text-lg font-bold ${format === f ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}>
                    {f.toUpperCase()}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">
                    {f === 'jpg' ? 'High Quality' : f === 'png' ? 'Lossless' : 'Animated'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/10">
            <p className="text-xs text-[var(--accent-blue)]/80 leading-relaxed">
              Exporting will apply all your grading adjustments to the original high-resolution image using our 32-bit WebGL engine.
            </p>
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-control)] border-t border-[var(--border)] flex gap-3">
          <button
            onClick={() => dispatch(setExportModalOpen(false))}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-[var(--accent-blue)] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/10"
          >
            <Download size={18} />
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
