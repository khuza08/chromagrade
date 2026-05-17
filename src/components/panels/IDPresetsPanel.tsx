import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { addPreset, deletePreset, importPresets } from '../../store/slices/presetsSlice';
import type { Preset } from '../../store/slices/presetsSlice';
import { applyPartialSnapshot } from '../../store/slices/gradingSlice';
import PresetCard from '../ui/PresetCard';
import { exportPresets, importPresets as readPresetsFile } from '../../utils/presetIO';
import { Plus, Download, Upload, AlertCircle } from 'lucide-react';

const IDPresetsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { prebuiltPresets, userPresets } = useSelector((state: RootState) => state.presets);
  const currentGrading = useSelector((state: RootState) => state.grading);
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleApplyPreset = (preset: Preset) => {
    dispatch(applyPartialSnapshot(preset.parameters));
  };

  const handleDeletePreset = (id: string) => {
    dispatch(deletePreset(id));
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
  };

  const handleExport = () => {
    exportPresets(userPresets);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      const imported = await readPresetsFile(file);
      dispatch(importPresets(imported));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
                onClick={() => setIsSaving(true)}
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
              disabled={userPresets.length === 0}
              className="flex items-center gap-1.5 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] disabled:opacity-40 disabled:hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer"
              title="Export custom presets"
            >
              <Download size={12} />
              Export
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
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
                  onApply={() => handleApplyPreset(preset)}
                  onDelete={preset.category === 'My Presets' ? () => handleDeletePreset(preset.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IDPresetsPanel;
