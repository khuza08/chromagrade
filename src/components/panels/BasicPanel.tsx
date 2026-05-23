import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import PerformanceSlider from "../ui/PerformanceSlider";
import {
  setExposure,
  setToneHighlights,
  setToneShadows,
  setWhites,
  setBlacks,
  setTexture,
  setClarity,
  setDehaze,
  setProfile,
  setBw,
  setHdr,
  setHdrLimit,
  setVisualizeHdr,
  setSdrPreview,
  setSdrBrightness,
  setSdrContrast,
  setSdrClarity,
  setSdrHighlights,
  setSdrShadows,
  setSdrWhites,
  setSdrHighlightSat,
  setWbPreset,
  resetBasic,
} from "../../store/slices/basicSlice";
import {
  setTemperature,
  setTint,
  setContrast,
  setSaturation,
  setVibrance,
} from "../../store/slices/gradingSlice";
import { canvasEngine } from "../../lib/CanvasEngine";

function computeAutoWB(imageData: ImageData): {
  temperature: number;
  tint: number;
} {
  const data = imageData.data;
  const len = data.length;

  // Step 1: compute luminance for every pixel, find 90th percentile threshold
  const luminances: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    luminances.push(lum);
  }
  luminances.sort((a, b) => a - b);
  const threshold = luminances[Math.floor(luminances.length * 0.9)];

  // Step 2: average only bright pixels
  let sumR = 0,
    sumG = 0,
    sumB = 0,
    count = 0;
  for (let i = 0; i < len; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (lum >= threshold) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count++;
    }
  }

  if (count === 0) return { temperature: 0, tint: 0 };

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const avgAll = (avgR + avgG + avgB) / 3;

  if (avgAll < 1) return { temperature: 0, tint: 0 };

  let temp = (-(avgB - avgR) / avgAll) * 50;
  let tint = -((avgG - (avgR + avgB) / 2) / avgAll) * 15; // reduced from 30 → 15

  temp = Math.max(-40, Math.min(40, temp));
  tint = Math.max(-10, Math.min(10, tint)); // tightened from ±20 → ±10

  return { temperature: Math.round(temp), tint: Math.round(tint) };
}

const BasicPanel: React.FC = () => {
  const dispatch = useDispatch();
  const basic = useSelector((state: RootState) => state.basic);
  const grading = useSelector((state: RootState) => state.grading);

  const [sdrOpen, setSdrOpen] = useState(false);

  const handleWbPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "as-shot" | "auto" | "custom";
    if (val === "as-shot") {
      dispatch(setTemperature(0));
      dispatch(setTint(0));
      dispatch(setWbPreset("as-shot"));
    } else if (val === "auto") {
      const proxy = canvasEngine.getProxyImageData();
      if (!proxy) return;
      const result = computeAutoWB(proxy);
      dispatch(setTemperature(result.temperature));
      dispatch(setTint(result.tint));
      dispatch(setWbPreset("auto"));
    }
  };

  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <h3 className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2 mt-4 px-3">
      {children}
    </h3>
  );

  return (
    <div className="flex flex-col pb-4">
      {/* Quick Actions Row */}
      <div className="flex gap-1 p-3">
        <button className="px-3 py-1 rounded-full text-[10px] font-bold border border-[var(--border)] hover:bg-[var(--bg-hover)]">
          Auto
        </button>
        <button
          onClick={() => {
            const next = !basic.bw;
            dispatch(setBw(next));
            dispatch(setProfile(next ? "Monochrome" : "Color"));
            dispatch(setSaturation(next ? -100 : 0));
          }}
          className={`px-3 py-1 rounded-full text-[10px] font-bold border ${basic.bw ? "bg-[var(--theme-primary)] text-white border-transparent" : "border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}
        >
          B&W
        </button>
        <button
          onClick={() => dispatch(setHdr(!basic.hdr))}
          className={`px-3 py-1 rounded-full text-[10px] font-bold border ${basic.hdr ? "bg-[var(--theme-primary)] text-white border-transparent" : "border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}
        >
          HDR
        </button>
      </div>

      {/* Profile Row */}
      <div className="px-3 flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Profile
        </span>
        <select
          value={basic.profile}
          onChange={(e) => {
            const mono = e.target.value === "Monochrome";
            dispatch(setProfile(e.target.value));
            dispatch(setBw(mono));
            dispatch(setSaturation(mono ? -100 : 0));
          }}
          className="bg-[var(--bg-control)] text-[10px] border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--theme-primary)]"
        >
          <option value="Color">Color</option>
          <option value="Monochrome">Monochrome</option>
        </select>
      </div>

      <SectionHeader>White Balance</SectionHeader>
      <div className="px-3 flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          WB
        </span>
        <select
          value={basic.wbPreset}
          onChange={handleWbPreset}
          className="bg-[var(--bg-control)] text-[10px] border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--theme-primary)]"
        >
          <option value="as-shot">As Shot</option>
          <option value="auto">Auto</option>
          <option value="custom" disabled>
            Custom
          </option>
        </select>
      </div>
      <div className="px-3 space-y-3">
        <PerformanceSlider
          label="Temp"
          min={-100}
          max={100}
          value={grading.temperature}
          onChange={(v) => {
            dispatch(setTemperature(v));
            dispatch(setWbPreset("custom"));
          }}
          onReset={() => {
            dispatch(setTemperature(0));
            dispatch(setWbPreset("custom"));
          }}
        />
        <PerformanceSlider
          label="Tint"
          min={-100}
          max={100}
          value={grading.tint}
          onChange={(v) => {
            dispatch(setTint(v));
            dispatch(setWbPreset("custom"));
          }}
          onReset={() => {
            dispatch(setTint(0));
            dispatch(setWbPreset("custom"));
          }}
        />
      </div>

      <SectionHeader>Tone</SectionHeader>
      <div className="px-3 space-y-3">
        <PerformanceSlider
          label="Exposure"
          min={-5}
          max={5}
          step={0.01}
          value={basic.exposure}
          onChange={(v) => dispatch(setExposure(v))}
          onReset={() => dispatch(setExposure(0))}
        />
        <PerformanceSlider
          label="Contrast"
          min={-100}
          max={100}
          value={grading.contrast}
          onChange={(v) => dispatch(setContrast(v))}
          onReset={() => dispatch(setContrast(0))}
        />
        <PerformanceSlider
          label="Highlights"
          min={-100}
          max={100}
          value={basic.toneHighlights}
          onChange={(v) => dispatch(setToneHighlights(v))}
          onReset={() => dispatch(setToneHighlights(0))}
        />
        <PerformanceSlider
          label="Shadows"
          min={-100}
          max={100}
          value={basic.toneShadows}
          onChange={(v) => dispatch(setToneShadows(v))}
          onReset={() => dispatch(setToneShadows(0))}
        />
        <PerformanceSlider
          label="Whites"
          min={-100}
          max={100}
          value={basic.whites}
          onChange={(v) => dispatch(setWhites(v))}
          onReset={() => dispatch(setWhites(0))}
        />
        <PerformanceSlider
          label="Blacks"
          min={-100}
          max={100}
          value={basic.blacks}
          onChange={(v) => dispatch(setBlacks(v))}
          onReset={() => dispatch(setBlacks(0))}
        />
      </div>

      <SectionHeader>Presence</SectionHeader>
      <div
        className="px-3 space-y-3 opacity-60"
        title="Shader support coming soon"
      >
        <PerformanceSlider
          label="Texture"
          min={-100}
          max={100}
          value={basic.texture}
          onChange={(v) => dispatch(setTexture(v))}
          onReset={() => dispatch(setTexture(0))}
        />
        <PerformanceSlider
          label="Clarity"
          min={-100}
          max={100}
          value={basic.clarity}
          onChange={(v) => dispatch(setClarity(v))}
          onReset={() => dispatch(setClarity(0))}
        />
        <PerformanceSlider
          label="Dehaze"
          min={-100}
          max={100}
          value={basic.dehaze}
          onChange={(v) => dispatch(setDehaze(v))}
          onReset={() => dispatch(setDehaze(0))}
        />
      </div>

      <SectionHeader>Color Intensity</SectionHeader>
      <div className="px-3 space-y-3">
        <PerformanceSlider
          label="Vibrance"
          min={-100}
          max={100}
          value={grading.vibrance}
          onChange={(v) => dispatch(setVibrance(v))}
          onReset={() => dispatch(setVibrance(0))}
        />
        <PerformanceSlider
          label="Saturation"
          min={-100}
          max={100}
          value={grading.saturation}
          onChange={(v) => dispatch(setSaturation(v))}
          onReset={() => dispatch(setSaturation(0))}
        />
      </div>

      {basic.hdr && (
        <div className="mt-4 opacity-60" title="Shader support coming soon">
          <SectionHeader>HDR</SectionHeader>
          <div className="px-3 space-y-3">
            <PerformanceSlider
              label="HDR Limit"
              min={0}
              max={10}
              value={basic.hdrLimit}
              onChange={(v) => dispatch(setHdrLimit(v))}
              onReset={() => dispatch(setHdrLimit(4))}
            />
            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={basic.visualizeHdr}
                onChange={(e) => dispatch(setVisualizeHdr(e.target.checked))}
                className="accent-[var(--theme-primary)]"
              />
              Visualize HDR
            </label>

            <div className="border border-[var(--border)] rounded mt-2">
              <button
                onClick={() => setSdrOpen(!sdrOpen)}
                className="w-full text-left px-3 py-2 text-[10px] font-bold flex justify-between items-center hover:bg-[var(--bg-hover)]"
              >
                SDR Rendition Settings
                <span>{sdrOpen ? "▲" : "▼"}</span>
              </button>

              {sdrOpen && (
                <div className="p-3 border-t border-[var(--border)] space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] mb-2">
                    <input
                      type="checkbox"
                      checked={basic.sdrPreview}
                      onChange={(e) =>
                        dispatch(setSdrPreview(e.target.checked))
                      }
                      className="accent-[var(--theme-primary)]"
                    />
                    Preview for SDR Display
                  </label>
                  <PerformanceSlider
                    label="Brightness"
                    min={-100}
                    max={100}
                    value={basic.sdrBrightness}
                    onChange={(v) => dispatch(setSdrBrightness(v))}
                  />
                  <PerformanceSlider
                    label="Contrast"
                    min={-100}
                    max={100}
                    value={basic.sdrContrast}
                    onChange={(v) => dispatch(setSdrContrast(v))}
                  />
                  <PerformanceSlider
                    label="Clarity"
                    min={-100}
                    max={100}
                    value={basic.sdrClarity}
                    onChange={(v) => dispatch(setSdrClarity(v))}
                  />
                  <PerformanceSlider
                    label="Highlights"
                    min={-100}
                    max={100}
                    value={basic.sdrHighlights}
                    onChange={(v) => dispatch(setSdrHighlights(v))}
                  />
                  <PerformanceSlider
                    label="Shadows"
                    min={-100}
                    max={100}
                    value={basic.sdrShadows}
                    onChange={(v) => dispatch(setSdrShadows(v))}
                  />
                  <PerformanceSlider
                    label="Whites"
                    min={-100}
                    max={100}
                    value={basic.sdrWhites}
                    onChange={(v) => dispatch(setSdrWhites(v))}
                  />
                  <PerformanceSlider
                    label="Highlight Saturation"
                    min={-100}
                    max={100}
                    value={basic.sdrHighlightSat}
                    onChange={(v) => dispatch(setSdrHighlightSat(v))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicPanel;
