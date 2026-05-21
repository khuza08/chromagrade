import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { addPreset, deletePreset, importPresets } from '../../store/slices/presetsSlice';
import type { Preset } from '../../store/slices/presetsSlice';
import { applyPartialSnapshot } from '../../store/slices/gradingSlice';
import type { GradingState } from '../../store/slices/gradingSlice';
import PresetCard from '../ui/PresetCard';
import { exportPresets, importPresets as readPresetsFile } from '../../utils/presetIO';
import { Plus, Download, Upload, AlertCircle, AlertTriangle, X } from 'lucide-react';

const isGradeChanged = (grade: GradingState): boolean => {
  // 1. Sliders check
  if (
    grade.contrast !== 0 ||
    grade.pivot !== 0.5 ||
    grade.saturation !== 0 ||
    grade.temperature !== 0 ||
    grade.tint !== 0
  ) {
    return true;
  }

  // 2. Color Wheels check
  const wheels = ['shadows', 'midtones', 'highlights', 'global'] as const;
  for (const wheel of wheels) {
    const value = grade.primary[wheel];
    if (value.x !== 0 || value.y !== 0 || value.luma !== 1.0) {
      return true;
    }
  }

  // 3. Curves check
  const channels = ['master', 'red', 'green', 'blue'] as const;
  for (const ch of channels) {
    const points = grade.curves[ch];
    if (points.length !== 2) return true;
    if (
      points[0].x !== 0 || points[0].y !== 0 ||
      points[1].x !== 1 || points[1].y !== 1
    ) {
      return true;
    }
  }

  // 4. HSL check
  const bins = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'] as const;
  for (const bin of bins) {
    const values = grade.hsl[bin];
    if (values.h !== 0 || values.s !== 0 || values.l !== 0) {
      return true;
    }
  }

  return false;
};

const IDPresetsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { prebuiltPresets, userPresets } = useSelector((state: RootState) => state.presets);
  const currentGrading = useSelector((state: RootState) => state.grading);
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast timer auto-dismiss with cleanup
  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(id);
  }, [toastMessage]);

  // Combine both preset lists
  const allPresets = [...prebuiltPresets, ...userPresets];

  // Get distinct categories
  const categories = ['All', 'Cinematic', 'Vintage', 'B&W', 'My Presets'];

  // Filter presets based on category selection
  const filteredPresets = allPresets.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'My Presets') return p.category === 'My Presets';
    return p.category === activeCategory;
  });

  const handlePresetClick = (e: React.MouseEvent, preset: Preset) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      // Multi-select toggle without applying grade
      setSelectedPresetIds(prev => {
        const next = new Set(prev);
        if (next.has(preset.id)) {
          next.delete(preset.id);
        } else {
          next.add(preset.id);
        }
        return next;
      });
    } else {
      // Single select and apply grade
      dispatch(applyPartialSnapshot(preset.parameters));
      setSelectedPresetIds(new Set([preset.id]));
    }
  };

  const handleDeletePreset = (id: string) => {
    dispatch(deletePreset(id));
    setSelectedPresetIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveCurrent = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: Preset = {
      id: `user-${Date.now()}`,
      name: newPresetName.trim(),
      category: 'My Presets',
      parameters: {
        contrast: currentGrading.contrast,
        pivot: currentGrading.pivot,
        saturation: currentGrading.saturation,
        temperature: currentGrading.temperature,
        tint: currentGrading.tint,
        primary: JSON.parse(JSON.stringify(currentGrading.primary)),
        curves: JSON.parse(JSON.stringify(currentGrading.curves)),
        hsl: JSON.parse(JSON.stringify(currentGrading.hsl)),
      }
    };

    dispatch(addPreset(newPreset));
    setNewPresetName('');
    setIsSaving(false);
    setSelectedPresetIds(new Set()); // Clear selection after saving new preset
  };

  const selectedExportPresets = allPresets.filter(p => selectedPresetIds.has(p.id));

  const handleExport = () => {
    if (selectedExportPresets.length > 0) {
      exportPresets(selectedExportPresets);
      setSelectedPresetIds(new Set()); // Clear selection after export
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      const { importedPresets, totalFound } = await readPresetsFile(file);
      dispatch(importPresets(importedPresets));
      setToastMessage(`Imported ${importedPresets.length} of ${totalFound} presets.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenSaveInput = () => {
    if (!isGradeChanged(currentGrading)) {
      setToastMessage("No changes detected. Adjust sliders, wheels, or curves before saving a preset.");
      return;
    }
    setIsSaving(true);
  };

  return (
    <div className="flex h-full bg-[var(--bg-panel)] p-4 gap-6 select-none">
      {/* Sidebar - Categories */}
      <div className="w-40 flex flex-col gap-1 border-r border-[var(--border)] pr-4">
        <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-2">Categories</h3>
        {categories.map(cat => {
          const count = cat === 'All' ? allPresets.length 
            : cat === 'My Presets' ? userPresets.length 
            : allPresets.filter(p => p.category === cat).length;
          
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex justify-between items-center px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-control)]'
              }`}
            >
              <span>{cat}</span>
              <span className="text-[9px] opacity-60 font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid and Actions */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          {isSaving ? (
            <div className="flex items-center gap-2 w-full max-w-sm">
              <input
                type="text"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--theme-primary)]"
                autoFocus
              />
              <button 
                onClick={handleSaveCurrent}
                disabled={!newPresetName.trim()}
                className="bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold transition-all"
              >
                Save
              </button>
              <button 
                onClick={() => { setIsSaving(false); setNewPresetName(''); }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSaveInput}
                className="flex items-center gap-1.5 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] px-3 py-1.5 rounded-md text-[11px] font-bold transition-all"
              >
                <Plus size={12} />
                Save Current Grade
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer"
              title="Import presets"
            >
              <Upload size={12} />
              Import
            </button>
            <button
              onClick={handleExport}
              disabled={selectedExportPresets.length === 0}
              className="flex items-center gap-1.5 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] disabled:opacity-40 disabled:hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer"
              title="Export selected custom presets"
            >
              <Download size={12} />
              {selectedExportPresets.length > 1 ? `Export (${selectedExportPresets.length})` : 'Export'}
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".chromagrade,.zip"
              className="hidden"
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs px-1">
            <AlertCircle size={12} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Presets Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
          {filteredPresets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] italic text-xs">
              No presets in this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredPresets.map(preset => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetIds.has(preset.id)}
                  onClick={(e) => handlePresetClick(e, preset)}
                  onDelete={preset.category === 'My Presets' ? () => handleDeletePreset(preset.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-[var(--bg-panel)]/95 border border-amber-500/25 backdrop-blur-md text-[var(--text-primary)] px-4 py-3 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors ml-1 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IDPresetsPanel;
