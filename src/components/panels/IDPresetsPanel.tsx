import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  addPreset,
  deletePreset,
  importPresets,
} from "../../store/slices/presetsSlice";
import type { Preset } from "../../store/slices/presetsSlice";
import { applyPartialSnapshot } from "../../store/slices/gradingSlice";
import { applyBasicSnapshot } from "../../store/slices/basicSlice";
import type { GradingState } from "../../store/slices/gradingSlice";
import PresetCard from "../ui/PresetCard";
import {
  exportPresets,
  importPresets as readPresetsFile,
} from "../../utils/presetIO";
import {
  Plus,
  Download,
  Upload,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";

const isGradeChanged = (grade: GradingState): boolean => {
  if (
    grade.contrast !== 0 ||
    grade.pivot !== 0.5 ||
    grade.saturation !== 0 ||
    grade.temperature !== 0 ||
    grade.tint !== 0
  ) {
    return true;
  }

  const wheels = ["shadows", "midtones", "highlights", "global"] as const;
  for (const wheel of wheels) {
    const value = grade.primary[wheel];
    if (value.x !== 0 || value.y !== 0 || value.luma !== 1.0) {
      return true;
    }
  }

  const channels = ["master", "red", "green", "blue"] as const;
  for (const ch of channels) {
    const points = grade.curves[ch];
    if (points.length !== 2) return true;
    if (
      points[0].x !== 0 ||
      points[0].y !== 0 ||
      points[1].x !== 1 ||
      points[1].y !== 1
    ) {
      return true;
    }
  }

  const bins = [
    "red",
    "orange",
    "yellow",
    "green",
    "aqua",
    "blue",
    "purple",
    "magenta",
  ] as const;
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
  const { prebuiltPresets, userPresets } = useSelector(
    (state: RootState) => state.presets,
  );
  const currentGrading = useSelector((state: RootState) => state.grading);
  const currentBasic = useSelector((state: RootState) => state.basic);

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(
    new Set(),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(id);
  }, [toastMessage]);

  const allPresets = [...prebuiltPresets, ...userPresets];
  const categories = ["All", "Cinematic", "Vintage", "B&W", "My Presets"];

  const filteredPresets = allPresets.filter((p) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "My Presets") return p.category === "My Presets";
    return p.category === activeCategory;
  });

  const handlePresetClick = (e: React.MouseEvent, preset: Preset) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      setSelectedPresetIds((prev) => {
        const next = new Set(prev);
        if (next.has(preset.id)) {
          next.delete(preset.id);
        } else {
          next.add(preset.id);
        }
        return next;
      });
    } else {
      dispatch(applyPartialSnapshot(preset.parameters));
      if (preset.basicParameters)
        dispatch(applyBasicSnapshot(preset.basicParameters as any));
      setSelectedPresetIds(new Set([preset.id]));
    }
  };

  const handleDeletePreset = (id: string) => {
    dispatch(deletePreset(id));
    setSelectedPresetIds((prev) => {
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
      category: "My Presets",
      parameters: {
        contrast: currentGrading.contrast,
        pivot: currentGrading.pivot,
        saturation: currentGrading.saturation,
        temperature: currentGrading.temperature,
        tint: currentGrading.tint,
        primary: JSON.parse(JSON.stringify(currentGrading.primary)),
        curves: JSON.parse(JSON.stringify(currentGrading.curves)),
        hsl: JSON.parse(JSON.stringify(currentGrading.hsl)),
      },
      basicParameters: JSON.parse(JSON.stringify(currentBasic)),
    };

    dispatch(addPreset(newPreset));
    setNewPresetName("");
    setIsSaving(false);
    setSelectedPresetIds(new Set());
  };

  const selectedExportPresets = allPresets.filter((p) =>
    selectedPresetIds.has(p.id),
  );

  const handleExport = () => {
    if (selectedExportPresets.length > 0) {
      exportPresets(selectedExportPresets);
      setSelectedPresetIds(new Set());
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      const { importedPresets, totalFound } = await readPresetsFile(file);
      dispatch(importPresets(importedPresets));
      setToastMessage(
        `Imported ${importedPresets.length} of ${totalFound} presets.`,
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenSaveInput = () => {
    if (!isGradeChanged(currentGrading)) {
      setToastMessage(
        "No changes detected. Adjust sliders, wheels, or curves before saving a preset.",
      );
      return;
    }
    setIsSaving(true);
  };

  return (
    <div className="flex flex-col pb-4 bg-[var(--bg-panel)] select-none h-full overflow-hidden">
      {/* Top Controller Actions Row: Category Selectors */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)] overflow-x-auto scrollbar-none min-w-0 shrink-0">
        {categories.map((cat) => {
          const count =
            cat === "All"
              ? allPresets.length
              : cat === "My Presets"
                ? userPresets.length
                : allPresets.filter((p) => p.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat
                  ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-control)]"
              }`}
            >
              <span>{cat}</span>
              <span className="text-[9px] opacity-50 font-mono font-normal">
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Tool & Config Strip */}
      <div className="flex flex-col gap-2 p-3 border-b border-[var(--border)] bg-[var(--bg-panel)]/30 shrink-0">
        {isSaving ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset lookup tag..."
              className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--theme-primary)] min-w-0"
              autoFocus
            />
            <button
              onClick={handleSaveCurrent}
              disabled={!newPresetName.trim()}
              className="bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-50 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-all shrink-0"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsSaving(false);
                setNewPresetName("");
              }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 text-[11px] transition-all shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <button
              onClick={handleOpenSaveInput}
              className="flex items-center gap-1 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Plus size={12} />
              Save Grade
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Import files"
              >
                <Upload size={11} />
                Import
              </button>
              <button
                onClick={handleExport}
                disabled={selectedExportPresets.length === 0}
                className="flex items-center gap-1 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] disabled:opacity-40 disabled:hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Export bundle files"
              >
                <Download size={11} />
                {selectedExportPresets.length > 1
                  ? `Exp (${selectedExportPresets.length})`
                  : "Export"}
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
        )}

        {/* Local Scope Error Messages */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-red-400 text-[10px] pt-1">
            <AlertCircle size={11} className="shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Flexible Core Preset Space */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {filteredPresets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] italic text-[11px] py-8">
            No dynamic presets matches found.
          </div>
        ) : (
          /* Uses minmax fluid matching constraints layout structure */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2.5">
            {filteredPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={selectedPresetIds.has(preset.id)}
                onClick={(e) => handlePresetClick(e, preset)}
                onDelete={
                  preset.category === "My Presets"
                    ? () => handleDeletePreset(preset.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Instructions Hint */}
      <div className="mt-auto mx-3 pt-2 border-t border-[var(--border)] shrink-0">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          Tip: Hold Command/Ctrl to choose multiple components for batch
          manifest exports.
        </p>
      </div>

      {/* Floating System Notifications Banner */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-[var(--bg-panel)]/95 border border-amber-500/20 backdrop-blur-md text-[var(--text-primary)] px-3 py-2.5 rounded-lg shadow-xl max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors ml-auto cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IDPresetsPanel;
