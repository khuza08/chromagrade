import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveLut, setLutStrength, setLutSize } from '../../store/slices/lutSlice';
import { parseCube, LutParseError } from '../../lib/lut/parseCube';
import { LUT_STRENGTH_MIN, LUT_STRENGTH_MAX } from '../../lib/lut/lutConstants';
import { canvasEngine } from '../../lib/CanvasEngine';
import PerformanceSlider from '../ui/PerformanceSlider';
import type { RootState } from '../../store/store';

const BUILT_IN_LUTS = [
  'BlueArchitecture',
  'BlueHour',
  'ColdChrome',
  'CrispAutumn',
  'DarkAndSomber',
  'HardBoost',
  'LongBeachMorning',
  'LushGreen',
  'MagicHour',
  'NaturalBoost',
  'OrangeAndBlue',
  'SoftBlackAndWhite',
  'Waves',
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
      canvasEngine.loadLut(data, size);
      dispatch(setActiveLut(name));
      dispatch(setLutSize(size));
      setError(null);
    } catch (e) {
      setError(e instanceof LutParseError ? e.message : 'Failed to load LUT.');
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
    canvasEngine.clearLut();
    dispatch(setActiveLut(null));
    setError(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await applyLut(file.name.replace(/\.cube$/i, ''), await file.text());
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      {error && (
        <p className="text-[10px] text-[var(--accent-red,#f87171)] bg-red-500/10 rounded px-2 py-1">{error}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={handleClear}
          className={`px-2 py-1 rounded text-[10px] border transition-colors ${activeLut === null ? 'bg-[var(--bg-control)] border-[var(--text-secondary)] text-[var(--text-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
        >
          None
        </button>
        {BUILT_IN_LUTS.map(name => (
          <button
            key={name}
            onClick={() => handleBuiltIn(name)}
            disabled={loading === name}
            className={`px-2 py-1 rounded text-[10px] border transition-colors ${activeLut === name ? 'bg-[var(--bg-control)] border-[var(--text-secondary)] text-[var(--text-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'} disabled:opacity-40`}
          >
            {loading === name ? '…' : name.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      <PerformanceSlider
        label="Strength"
        min={LUT_STRENGTH_MIN}
        max={LUT_STRENGTH_MAX}
        value={strength}
        onChange={v => dispatch(setLutStrength(v))}
        onReset={() => dispatch(setLutStrength(100))}
      />

      <button
        onClick={() => fileRef.current?.click()}
        className="text-[10px] px-3 py-1.5 border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
      >
        Import .cube
      </button>
      <input ref={fileRef} type="file" accept=".cube" className="hidden" onChange={handleImport} />
    </div>
  );
}
