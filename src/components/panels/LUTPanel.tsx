import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveLut,
  setLutStrength,
  setLutSize,
} from "../../store/slices/lutSlice";
import { pushSnapshot } from "../../store/slices/historySlice";
import { captureSnapshot } from "../../utils/historyUtils";
import { setActivePresetId } from "../../store/slices/presetsSlice";
import { parseCube, LutParseError } from "../../lib/lut/parseCube";
import { LUT_STRENGTH_MIN, LUT_STRENGTH_MAX } from "../../lib/lut/lutConstants";
import { canvasEngine } from "../../lib/CanvasEngine";
import PerformanceSlider from "../ui/PerformanceSlider";
import type { RootState } from "../../store/store";
import { Upload } from "lucide-react";

const BUILT_IN_LUTS = [
  "BlueArchitecture",
  "BlueHour",
  "ColdChrome",
  "CrispAutumn",
  "DarkAndSomber",
  "HardBoost",
  "LongBeachMorning",
  "LushGreen",
  "MagicHour",
  "NaturalBoost",
  "OrangeAndBlue",
  "SoftBlackAndWhite",
  "Waves",
];

export default function LUTPanel() {
  const dispatch = useDispatch();
  const activeLut = useSelector((s: RootState) => s.lut.activeLut);
  const strength = useSelector((s: RootState) => s.lut.strength);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function applyLut(name: string, text: string) {
    try {
      const { size, data } = parseCube(text);
      dispatch(pushSnapshot(captureSnapshot()));
      dispatch(setActivePresetId(null));
      canvasEngine.loadLut(data, size);
      dispatch(setActiveLut(name));
      dispatch(setLutSize(size));
      setError(null);
    } catch (e) {
      setError(e instanceof LutParseError ? e.message : "Failed to load LUT.");
    }
  }

  async function handleBuiltIn(name: string) {
    setLoading(name);
    try {
      const res = await fetch(`/luts/${name}.cube`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await applyLut(name, await res.text());
    } catch (e) {
      setError(`Could not load "${name}".`);
    } finally {
      setLoading(null);
    }
  }

  function handleClear() {
    dispatch(pushSnapshot(captureSnapshot()));
    dispatch(setActivePresetId(null));
    canvasEngine.clearLut();
    dispatch(setActiveLut(null));
    setError(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await applyLut(file.name.replace(/\.cube$/i, ""), await file.text());
    e.target.value = "";
  }

  return (
    <div className="flex flex-col pb-4 bg-[var(--bg-panel)] select-none">
      {/* Top Controller Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
        <button
          onClick={handleClear}
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-none ${
            activeLut === null
              ? "bg-[var(--bg-base)] border-[var(--text-secondary)] text-[var(--text-primary)] shadow-sm"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          None
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 bg-[var(--bg-base)] hover:bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-none cursor-pointer"
        >
          <Upload size={11} />
          Import .cube
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".cube"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* Target Descriptor Label Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]/30">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
          Lookup Tables Library
        </span>
      </div>

      {/* Local Panel Error Messages */}
      {error && (
        <div className="mx-3 mt-2">
          <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/10 rounded px-2 py-1.5 truncate">
            {error}
          </p>
        </div>
      )}

      {/* Main Core LUT Library Selection Field */}
      <div className="px-3 py-3 overflow-y-auto min-h-0 max-h-[320px] border-b border-[var(--border)]">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
          {BUILT_IN_LUTS.map((name) => (
            <button
              key={name}
              onClick={() => handleBuiltIn(name)}
              disabled={loading === name}
              className={`h-8 px-2 rounded text-[10px] border text-center transition-none flex items-center justify-center shrink-0 disabled:opacity-50 overflow-hidden text-ellipsis ${
                activeLut === name
                  ? "bg-[var(--theme-primary)]/10 border-[var(--theme-primary)] text-[var(--text-primary)] font-bold"
                  : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-panel)] hover:bg-[var(--bg-control)] hover:text-[var(--text-primary)] font-medium"
              }`}
            >
              <span
                className={`truncate text-inherit transition-opacity ${loading === name ? "opacity-40" : ""}`}
              >
                {name.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Sliders Config Section Stack */}
      <div className="px-3 pt-3 pb-1">
        <PerformanceSlider
          label="LUT Strength"
          min={LUT_STRENGTH_MIN}
          max={LUT_STRENGTH_MAX}
          value={strength}
          onChange={(v) => dispatch(setLutStrength(v))}
          onReset={() => dispatch(setLutStrength(100))}
        />
      </div>

      {/* Vertical Tooltips Footer */}
      <div className="mt-2 mx-3 pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          Tip: Imported lookup modifications are held locally inside transient
          memory caches unless packaged to custom disk bundles.
        </p>
      </div>
    </div>
  );
}
